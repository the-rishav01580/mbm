import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ArrowLeft, Wallet, User, CreditCard, Loader2, Phone, MessageSquare, Edit, Trash, Download, Calculator, Calendar, ChevronLeft, ChevronRight, Edit2, Trash2, Upload, AlertCircle, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDaysUntilDue } from "@/lib/dateUtils";
import { getDaysUntilDue } from "@/lib/dateUtils";
import { toast } from "sonner";
import { format } from 'date-fns';
import Papa from 'papaparse';
import { isNull } from "util";

// --- TYPES ---
type PaymentMethod = "Cash" | "Online";
type PaymentStatus = "completed" | "pending";
type MealShift = "lunch" | "dinner" | "both";

interface Student { 
  id: string; 
  name: string; 
  phone: string; 
  father_name: string; 
  father_phone: string; 
  branch: string; 
  enrollment_number: string; 
  registration_date: string; 
  due_date: string; 
  photo_url?: string; 
  status: 'active' | 'fees_due' | 'inactive'; 
  fees_paid: number; 
  fees_due: number;
  shift?: MealShift;
}

interface PaymentTransaction { 
  id: string; 
  payment_date: string; 
  amount: number; 
  method: PaymentMethod; 
  status: PaymentStatus; 
  notes?: string; 
  student_id: string; 
}

interface PaymentFormState { 
  id?: string; 
  date: string; 
  amount: string; 
  method: PaymentMethod; 
  status: PaymentStatus; 
  notes: string; 
}

// --- HELPER FUNCTIONS & CONSTANTS ---
const currencyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const createEmptyFormState = (): PaymentFormState => ({ date: format(new Date(), "yyyy-MM-dd"), amount: "", method: "Cash", status: "completed", notes: "" });
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Helper function to get shift badge with colors
const getShiftBadge = (shift?: MealShift) => {
  if (!shift) return null;
  
  const shiftConfig = {
    lunch: { label: "Lunch Only", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" },
    dinner: { label: "Dinner Only", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
    both: { label: "Both (Lunch & Dinner)", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" }
  };
  
  const config = shiftConfig[shift];
  return (
    <Badge className={config.color}>
      <Utensils className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

// --- SUB-COMPONENTS ---
const SummaryCards = ({ totalPaid, totalPending, totalTransactions }: { totalPaid: number, totalPending: number, totalTransactions: number }) => ( 
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <Card><CardContent className="pt-4"><div className="text-sm font-medium text-muted-foreground">Total Paid</div><div className="text-2xl font-bold text-green-600">{currencyFormatter.format(totalPaid)}</div></CardContent></Card>
    <Card><CardContent className="pt-4"><div className="text-sm font-medium text-muted-foreground">Amount Due</div><div className="text-2xl font-bold text-destructive">{currencyFormatter.format(totalPending)}</div></CardContent></Card>
    <Card><CardContent className="pt-4"><div className="text-sm font-medium text-muted-foreground">Transactions</div><div className="text-2xl font-bold">{totalTransactions}</div></CardContent></Card>
  </div> 
);

const PaymentTable = ({ transactions, onEdit, onDelete, formatAmount }: { transactions: PaymentTransaction[], onEdit: (t: PaymentTransaction) => void, onDelete: (id: string) => void, formatAmount: (n: number) => string }) => ( 
  <div className="border rounded-lg overflow-hidden bg-background"><table className="w-full text-sm"><thead className="bg-muted/50"><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Amount</th><th className="p-3 text-left">Method</th><th className="p-3 text-left">Status</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{transactions.length === 0 ? (<tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No payment history found.</td></tr>) : ( transactions.map(t => (<tr key={t.id} className="border-t"><td className="p-3">{format(new Date(t.payment_date), 'dd MMM, yyyy')}</td><td className="p-3 font-medium">{formatAmount(t.amount)}</td><td className="p-3">{t.method}</td><td className="p-3"><Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className={t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>{t.status}</Badge></td><td className="p-3 text-right"><Button variant="ghost" size="icon" onClick={() => onEdit(t)}><Edit2 className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => onDelete(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></td></tr>)))}</tbody></table></div>
);

const PaymentForm = ({ formState, isEditing, isSaving, onChange, onSubmit, onCancel }: { formState: PaymentFormState, isEditing: boolean, isSaving: boolean, onChange: (u: Partial<PaymentFormState>) => void, onSubmit: () => void, onCancel: () => void }) => ( 
  <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4"><h4 className="font-semibold">{isEditing ? "Edit Payment" : "Record New Payment"}</h4><div className="grid sm:grid-cols-4 gap-3"><div className="space-y-1"><Label htmlFor="date">Date</Label><Input id="date" type="date" value={formState.date} onChange={e => onChange({ date: e.target.value })} /></div><div className="space-y-1"><Label htmlFor="amount">Amount</Label><Input id="amount" type="number" placeholder="0.00" value={formState.amount} onChange={e => onChange({ amount: e.target.value })} /></div><div className="space-y-1"><Label>Method</Label><Select value={formState.method} onValueChange={(v: PaymentMethod) => onChange({ method: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Online">Online</SelectItem></SelectContent></Select></div><div className="space-y-1"><Label>Status</Label><Select value={formState.status} onValueChange={(v: PaymentStatus) => onChange({ status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="completed">Completed</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select></div></div><div className="space-y-1"><Label htmlFor="notes">Notes (Optional)</Label><Input id="notes" placeholder="e.g., Mess fee for October" value={formState.notes} onChange={e => onChange({ notes: e.target.value })} /></div><div className="flex justify-end gap-2">{isEditing && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}<Button type="button" onClick={onSubmit} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isEditing ? "Update Payment" : "Record Payment"}</Button></div></div>
);

const EditStudentDialog = ({ isOpen, onClose, student, onSave }: { isOpen: boolean, onClose: () => void, student: Student | null, onSave: (updatedStudent: Partial<Student>, newPhoto: File | null) => void }) => { 
  const [formData, setFormData] = useState<Partial<Student>>({}); 
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null); 
  const [photoPreview, setPhotoPreview] = useState<string | null>(null); 
  
  useEffect(() => { 
    if (student) { 
      setFormData(student); 
      setPhotoPreview(student.photo_url || null); 
    } 
  }, [student, isOpen]); 
  
  const handleChange = (field: keyof Student, value: string | Date | null) => { 
    let finalValue = value; 
    if (value instanceof Date) { 
      finalValue = format(value, 'yyyy-MM-dd'); 
    } 
    setFormData(prev => ({ ...prev, [field]: finalValue })); 
  }; 
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file) { 
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setNewPhotoFile(file); 
      setPhotoPreview(URL.createObjectURL(file)); 
    } 
  }; 
  
  const handleSaveChanges = () => { 
    onSave(formData, newPhotoFile); 
    onClose(); 
  }; 
  
  if (!student) return null; 
  
  return ( 
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Student Details</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Enrollment Number</Label>
            <Input value={formData.enrollment_number || ''} onChange={e => handleChange('enrollment_number', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Father's Phone</Label>
            <Input value={formData.father_phone || ''} onChange={e => handleChange('father_phone', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Branch</Label>
            <Input value={formData.branch || ''} onChange={e => handleChange('branch', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Meal Shift</Label>
            <Select value={formData.shift || ''} onValueChange={(v: MealShift) => handleChange('shift', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lunch">Lunch Only</SelectItem>
                <SelectItem value="dinner">Dinner Only</SelectItem>
                <SelectItem value="both">Both (Lunch & Dinner)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Registration Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {formData.registration_date ? format(new Date(formData.registration_date), "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent mode="single" selected={formData.registration_date ? new Date(formData.registration_date) : undefined} onSelect={(d) => d && handleChange('registration_date', d)} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Next Fee Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {formData.due_date ? format(new Date(formData.due_date), "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent mode="single" selected={formData.due_date ? new Date(formData.due_date) : undefined} onSelect={(d) => d && handleChange('due_date', d)} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v: Student['status']) => handleChange('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="fees_due">Fees Due</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-full">
            <Label>Profile Photo</Label>
            <div className="flex items-center gap-4">
              <img src={photoPreview || `https://ui-avatars.com/api/?name=${student.name}&background=random`} alt="preview" className="w-16 h-16 rounded-full object-cover"/>
              <Button type="button" variant="outline" size="sm" className="relative">
                <Upload className="w-4 h-4 mr-2" /> Change Photo
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog> 
  );
};

const FeesCalculator = ({ formatAmount }: { formatAmount: (amount: number) => string }) => { 
  const [monthlyFee, setMonthlyFee] = useState("2900"); 
  const [absentDays, setAbsentDays] = useState(null); 
  const totalAmount = useMemo(() => { 
    const fee = parseFloat(monthlyFee) || 0; 
    const days = parseInt(absentDays) || 0; 
    if (fee <= 0 || days < 0) return fee; 
    const deductionPerDay = fee / 60; 
    return Math.max(0, fee - (deductionPerDay * days)); 
  }, [monthlyFee, absentDays]); 
  
  return ( 
    <Card className="shadow-card bg-gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" /> Fees Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Monthly Fee</Label>
          <Input type="number" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} />
        </div>
        <div>
          <Label>Absent Days</Label>
          <Input type="number" value={absentDays} onChange={e => setAbsentDays(e.target.value)} />
        </div>
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Payable</span>
            <strong className="text-lg">{formatAmount(totalAmount)}</strong>
          </div>
        </div>
      </CardContent>
    </Card> 
  );
};

const MonthlyPaymentCalendar = ({ transactions }: { transactions: PaymentTransaction[] }) => { 
  const [year, setYear] = useState(new Date().getFullYear()); 
  const monthlyStatuses = useMemo(() => { 
    const paidMonths = new Set<number>(); 
    transactions.forEach(t => { 
      if (t.status === 'completed') { 
        const transactionDate = new Date(t.payment_date); 
        if (transactionDate.getFullYear() === year) paidMonths.add(transactionDate.getMonth()); 
      } 
    }); 
    return months.map((monthName, index) => ({ name: monthName, status: paidMonths.has(index) ? 'paid' : 'pending' })); 
  }, [transactions, year]); 
  
  return ( 
    <Card className="shadow-card bg-gradient-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Monthly Status
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setYear(y => y - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold">{year}</span>
            <Button variant="ghost" size="icon" onClick={() => setYear(y => y + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2">
        {monthlyStatuses.map(({ name, status }) => (
          <div key={name} className={`p-2 rounded-lg text-center border ${status === 'paid' ? 'bg-green-100 border-green-200 text-green-800' : 'bg-muted/50'}`}>
            <p className="font-medium text-sm">{name}</p>
            <Badge variant={status === 'paid' ? 'default' : 'secondary'} className={status === 'paid' ? 'bg-green-600' : ''}>
              {status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card> 
  );
};

const ReminderActions = ({ student, totalPending }: { student: Student, totalPending: number }) => { 
  const whatsappUrl = useMemo(() => { 
    let phoneNumber = student.phone.replace(/[^0-9]/g, ''); 
    if (phoneNumber.length === 10) phoneNumber = '91' + phoneNumber; 
    let message: string; 
    if (totalPending > 0) { 
      const amountDue = currencyFormatter.format(totalPending); 
      message = `Hi ${student.name}, this is a friendly reminder from the mess management. Your fee of ${amountDue} is pending. Please pay at your earliest convenience. Thank you!`; 
    } else { 
      message = `Hi ${student.name}, this is a message from the MAA BHAGVATI MESS.`; 
    } 
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`; 
  }, [student.name, student.phone, totalPending]); 
  
  return ( 
    <Card className="shadow-card bg-gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" /> Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Quickly contact the student.</p>
        <Button asChild className="w-full">
          <a href={`tel:${student.phone}`}>
            <Phone className="w-4 h-4 mr-2" /> Call Student
          </a>
        </Button>
        <Button variant="outline" className="w-full" onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}>
          <MessageSquare className="w-4 h-4 mr-2" /> Send WhatsApp Message
        </Button>
      </CardContent>
    </Card> 
  );
};

// --- MAIN COMPONENT ---
const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<PaymentFormState>(createEmptyFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Calculate totals from transactions
  const totalPaid = useMemo(() => 
    transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalPending = useMemo(() => 
    transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  useEffect(() => {
    if (!id) {
      toast.error("No student ID found in URL.");
      setLoading(false);
      navigate('/profiles');
      return;
    }
    const fetchAllData = async () => {
      try {
        const [studentRes, transactionsRes] = await Promise.all([
          supabase.from('students').select('*').eq('id', id).single(),
          supabase.from('transactions').select('*').eq('student_id', id).order('payment_date', { ascending: false })
        ]);
        if (studentRes.error) throw studentRes.error;
        setStudent(studentRes.data);
        if (transactionsRes.error && transactionsRes.error.code !== 'PGRST116') throw transactionsRes.error;
        setTransactions(transactionsRes.data || []);
      } catch (e: any) {
        toast.error('Failed to load student data: ' + e.message);
        navigate('/profiles');
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchAllData();
    const channel = supabase.channel(`student-profile-${id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `id=eq.${id}` }, fetchAllData).on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `student_id=eq.${id}` }, fetchAllData).subscribe();
    const channel = supabase.channel(`student-profile-${id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `id=eq.${id}` }, fetchAllData).on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `student_id=eq.${id}` }, fetchAllData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, navigate]);
  
  const daysLeft = useMemo(() => student && student.due_date ? getDaysUntilDue(student.due_date) : 0, [student]);
  const daysLeft = useMemo(() => student && student.due_date ? getDaysUntilDue(student.due_date) : 0, [student]);
  const formatAmount = useCallback((amount: number) => currencyFormatter.format(amount || 0), []);
  const resetForm = useCallback(() => { setFormState(createEmptyFormState()); setIsEditing(false); }, []);
  const handleFormChange = useCallback((update: Partial<PaymentFormState>) => setFormState(prev => ({ ...prev, ...update })), []);

  const handleAddOrUpdatePayment = async () => {
    if (!student) return;
    const amount = Number(formState.amount);
    if (!formState.date || isNaN(amount) || amount <= 0) {
      toast.error("Please provide a valid date and amount."); return;
      toast.error("Please provide a valid date and amount."); return;
    }
    setIsSaving(true);
    try {
      const payload = { student_id: student.id, payment_date: formState.date, amount, method: formState.method, status: formState.status, notes: formState.notes || null };
      const { error } = await supabase.from('transactions').upsert(isEditing ? { id: formState.id!, ...payload } : payload);
      if (error) throw error;
      toast.success(`Payment ${isEditing ? 'updated' : 'recorded'} successfully!`);
      resetForm();
    } catch (error: any) {
      toast.error("Operation failed: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleEditPayment = (transaction: PaymentTransaction) => { 
    setFormState({ id: transaction.id, date: transaction.payment_date, amount: transaction.amount.toString(), method: transaction.method, status: transaction.status, notes: transaction.notes ?? "" }); 
    setIsEditing(true); 
  };
  
  const handleDeletePayment = async (transactionId: string) => {
    if (!window.confirm("Are you sure? This will permanently delete the payment.")) return;
    setIsSaving(true);
    try {
        const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
        if (error) throw error;
        toast.success("Payment deleted successfully!");
    } catch (error: any) {
        toast.error("Failed to delete payment: " + error.message);
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleUpdateStudent = async (updatedData: Partial<Student>, newPhotoFile: File | null) => {
    if (!student) return;
    try {
        let finalUpdateData: Partial<Student> = { ...updatedData };
        if (newPhotoFile) {
            const fileExt = newPhotoFile.name.split('.').pop();
            const fileName = `${student.id}_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('student-photos').upload(fileName, newPhotoFile, { upsert: true });
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('student-photos').getPublicUrl(fileName);
            finalUpdateData.photo_url = data.publicUrl;
        }
        const { id, created_at, fees_paid, fees_due, ...updatableData } = finalUpdateData;
        const { error } = await supabase.from('students').update(updatableData).eq('id', student.id);
        if (error) throw error;
        toast.success("Student details updated successfully!");
    } catch (error: any) {
        toast.error("Failed to update details: " + error.message);
    }
  };
  
  const handleDeleteStudent = async () => { 
    if (!student) return; 
    if (!window.confirm(`Are you sure you want to delete ${student.name}'s profile? All associated data will be lost.`)) return; 
    try { 
      const { error } = await supabase.from('students').delete().eq('id', student.id); 
      if (error) throw error; 
      toast.success("Student profile deleted permanently."); 
      navigate('/profiles'); 
    } catch (error: any) { 
      toast.error("Failed to delete student: " + error.message); 
    } 
  };
  
  const handleExportCsv = () => { 
    if (transactions.length === 0) { 
      toast.info("No payments to export."); 
      return; 
    } 
    try {
      const csvData = transactions.map(t => ({ 
        Date: t.payment_date, 
        Amount: t.amount, 
        Method: t.method, 
        Status: t.status, 
        Notes: t.notes || '' 
      })); 
      const csv = Papa.unparse(csvData); 
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); 
      const link = document.createElement('a'); 
      link.href = URL.createObjectURL(blob); 
      link.download = `${student?.name}_payments_${new Date().toISOString().split('T')[0]}.csv`; 
      link.click(); 
      toast.success("Payment history exported!"); 
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  if (loading) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-4 text-muted-foreground">Loading Student Profile...</p></div>;
  if (!student) return <div className="p-8 text-center"><h2 className="text-2xl font-bold">Student Not Found</h2><p className="text-muted-foreground">The student with the specified ID could not be found.</p><Button onClick={() => navigate('/profiles')} className="mt-4">Back to Profiles</Button></div>;

  return (
    <div className="space-y-6 pb-8">
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full cursor-zoom-in" onClick={() => setPreviewOpen(true)}>
                {student.photo_url ? <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full rounded-full bg-gradient-primary flex items-center justify-center"><span className="text-white text-lg font-bold">{student.name.split(' ').map(n=>n[0]).join('')}</span></div>}
            </div>
            <div><h1 className="text-2xl font-bold text-foreground">{student.name}</h1><p className="text-sm text-muted-foreground">{student.enrollment_number}</p></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}><Edit className="w-4 h-4 mr-2" /> Edit Profile</Button>
          <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}><Trash className="w-4 h-4 mr-2" /> Delete Profile</Button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-card bg-gradient-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Personal & Academic Details</CardTitle></CardHeader>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Personal & Academic Details</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                <div><strong className="text-muted-foreground">Enrollment:</strong> {student.enrollment_number}</div>
                <div><strong className="text-muted-foreground">Branch:</strong> {student.branch}</div>
                <div><strong className="text-muted-foreground">Phone:</strong> {student.phone}</div>
                <div><strong className="text-muted-foreground">Father's Name:</strong> {student.father_name}</div>
                <div><strong className="text-muted-foreground">Father's Phone:</strong> {student.father_phone}</div>
                <div><strong className="text-muted-foreground">Registered On:</strong> {format(new Date(student.registration_date), 'dd MMM, yyyy')}</div>
                <div><strong className="text-muted-foreground">Due Date:</strong> {student.due_date ? format(new Date(student.due_date), 'dd MMM, yyyy') : 'Not Set'}</div>
                <div><strong className="text-muted-foreground">Meal Shift:</strong> {getShiftBadge(student.shift) || 'Not Set'}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card bg-gradient-card">
            <CardHeader><div className="flex justify-between items-center"><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Payment History</CardTitle><Button variant="outline" size="sm" onClick={handleExportCsv}><Download className="w-4 h-4 mr-2" /> Export CSV</Button></div></CardHeader>
            <CardContent className="space-y-4">
              <SummaryCards totalPaid={totalPaid} totalPending={totalPending} totalTransactions={transactions.length} />
              <PaymentTable transactions={transactions} onEdit={handleEditPayment} onDelete={handleDeletePayment} formatAmount={formatAmount} />
              <PaymentForm formState={formState} isEditing={isEditing} isSaving={isSaving} onChange={handleFormChange} onSubmit={handleAddOrUpdatePayment} onCancel={resetForm} />
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-6">
          <Card className="shadow-card bg-gradient-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Next Fee Cycle</CardTitle></CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">Next due on {student.due_date ? format(new Date(student.due_date), 'dd MMMM, yyyy') : 'Not Set'}</p>
              <div className={`mt-4 text-5xl font-bold ${daysLeft < 0 ? 'text-destructive' : 'text-green-600'}`}>
                {daysLeft < 0 ? Math.abs(daysLeft) : daysLeft}
              </div>
              <p className={`font-medium ${daysLeft < 0 ? 'text-destructive/80' : 'text-muted-foreground'}`}>{daysLeft < 0 ? `day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue` : `day${daysLeft !== 1 ? 's' : ''} left`}</p>
              <div className="pt-4 mt-4 border-t space-y-2 text-sm text-left">
                  <div className="flex justify-between items-center">
                    <span>Status:</span> 
                    <Badge variant={student.status === 'active' ? 'default' : 'destructive'} className={student.status === 'active' ? 'bg-green-100 text-green-700' : ''}>
                      {student.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Shift:</span>
                    {getShiftBadge(student.shift) || <span className="text-muted-foreground">Not Set</span>}
                  </div>
              </div>
            </CardContent>
          </Card>
          <ReminderActions student={student} totalPending={totalPending} />
          <MonthlyPaymentCalendar transactions={transactions} />
          <FeesCalculator formatAmount={formatAmount} />
        </aside>
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}><DialogContent className="p-2"><img src={student.photo_url || ''} alt={student.name} className="max-w-full max-h-[80vh] rounded-md" /></DialogContent></Dialog>
      <EditStudentDialog isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} student={student} onSave={handleUpdateStudent} />
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}><DialogContent><DialogHeader><DialogTitle>Delete Student Profile?</DialogTitle></DialogHeader><p>Are you sure you want to delete {student.name}'s profile? All associated payment history will also be permanently deleted. This action cannot be undone.</p><DialogFooter><Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteStudent}>Confirm Delete</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
};

export default StudentProfile;
