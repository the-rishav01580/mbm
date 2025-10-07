import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Wallet, User, CreditCard, Loader2, Phone, MessageSquare, Edit, Trash, Download, Calculator, Calendar, ChevronLeft, ChevronRight, Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateDueDate, getDaysUntilDue } from "@/lib/dateUtils";
import { toast } from "sonner";
import { format } from 'date-fns';
import Papa from 'papaparse';

// --- TYPES ---
type PaymentMethod = "Cash" | "Online";
type PaymentStatus = "completed" | "pending";
interface Student { id: string; name: string; phone: string; father_name: string; father_phone: string; branch: string; enrollment_number: string; registration_date: string; photo_url?: string; status: 'active' | 'fees_due' | 'inactive'; fees_paid: number; fees_due: number; }
interface PaymentTransaction { id: string; payment_date: string; amount: number; method: PaymentMethod; status: PaymentStatus; notes?: string; student_id: string; }
interface PaymentFormState { id?: string; date: string; amount: string; method: PaymentMethod; status: PaymentStatus; notes: string; }

// --- HELPER FUNCTIONS & CONSTANTS ---
const currencyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const createEmptyFormState = (): PaymentFormState => ({ date: format(new Date(), "yyyy-MM-dd"), amount: "", method: "Cash", status: "completed", notes: "" });
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// --- SUB-COMPONENTS ---
const SummaryCards = ({ cards }: { cards: { label: string, value: string, tone?: 'success' | 'danger' }[] }) => ( <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{cards.map(({ label, value, tone }) => (<Card key={label}><CardContent className="pt-4"><div className="text-sm font-medium text-muted-foreground">{label}</div><div className={`text-2xl font-bold ${tone === 'success' ? 'text-green-600' : tone === 'danger' ? 'text-destructive' : ''}`}>{value}</div></CardContent></Card>))}</div> );
const PaymentTable = ({ transactions, onEdit, onDelete, formatAmount }: { transactions: PaymentTransaction[], onEdit: (t: PaymentTransaction) => void, onDelete: (id: string) => void, formatAmount: (n: number) => string }) => ( <div className="border rounded-lg overflow-hidden bg-background"><table className="w-full text-sm"><thead className="bg-muted/50"><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Amount</th><th className="p-3 text-left">Method</th><th className="p-3 text-left">Status</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{transactions.length === 0 ? (<tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No payment history found.</td></tr>) : ( transactions.map(t => (<tr key={t.id} className="border-t"><td className="p-3">{format(new Date(t.payment_date), 'dd MMM, yyyy')}</td><td className="p-3 font-medium">{formatAmount(t.amount)}</td><td className="p-3">{t.method}</td><td className="p-3"><Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className={t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>{t.status}</Badge></td><td className="p-3 text-right"><Button variant="ghost" size="icon" onClick={() => onEdit(t)}><Edit2 className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => onDelete(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></td></tr>)))}</tbody></table></div>);
const PaymentForm = ({ formState, isEditing, isSaving, onChange, onSubmit, onCancel }: { formState: PaymentFormState, isEditing: boolean, isSaving: boolean, onChange: (u: Partial<PaymentFormState>) => void, onSubmit: () => void, onCancel: () => void }) => ( <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4"><h4 className="font-semibold">{isEditing ? "Edit Payment" : "Record New Payment"}</h4><div className="grid sm:grid-cols-4 gap-3"><div className="space-y-1"><Label htmlFor="date">Date</Label><Input id="date" type="date" value={formState.date} onChange={e => onChange({ date: e.target.value })} /></div><div className="space-y-1"><Label htmlFor="amount">Amount</Label><Input id="amount" type="number" placeholder="0.00" value={formState.amount} onChange={e => onChange({ amount: e.target.value })} /></div><div className="space-y-1"><Label>Method</Label><Select value={formState.method} onValueChange={(v: PaymentMethod) => onChange({ method: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Online">Online</SelectItem></SelectContent></Select></div><div className="space-y-1"><Label>Status</Label><Select value={formState.status} onValueChange={(v: PaymentStatus) => onChange({ status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="completed">Completed</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select></div></div><div className="space-y-1"><Label htmlFor="notes">Notes (Optional)</Label><Input id="notes" placeholder="e.g., Mess fee for October" value={formState.notes} onChange={e => onChange({ notes: e.target.value })} /></div><div className="flex justify-end gap-2">{isEditing && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}<Button type="button" onClick={onSubmit} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isEditing ? "Update Payment" : "Record Payment"}</Button></div></div>);
const EditStudentDialog = ({ isOpen, onClose, student, onSave }: { isOpen: boolean, onClose: () => void, student: Student | null, onSave: (updatedStudent: Partial<Student>) => void }) => { const [formData, setFormData] = useState<Partial<Student>>({}); useEffect(() => { if (student) setFormData(student); }, [student]); const handleChange = (field: keyof Student, value: string) => setFormData(prev => ({ ...prev, [field]: value })); const handleSaveChanges = () => { onSave(formData); onClose(); }; if (!student) return null; return ( <Dialog open={isOpen} onOpenChange={onClose}><DialogContent><DialogHeader><DialogTitle>Edit Student Details</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="space-y-2"><Label>Full Name</Label><Input value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} /></div><div className="space-y-2"><Label>Phone</Label><Input value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} /></div><div className="space-y-2"><Label>Father's Name</Label><Input value={formData.father_name || ''} onChange={e => handleChange('father_name', e.target.value)} /></div><div className="space-y-2"><Label>Branch</Label><Input value={formData.branch || ''} onChange={e => handleChange('branch', e.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSaveChanges}>Save Changes</Button></DialogFooter></DialogContent></Dialog> );};
const FeesCalculator = ({ formatAmount }: { formatAmount: (amount: number) => string }) => { const [monthlyFee, setMonthlyFee] = useState("3000"); const [absentDays, setAbsentDays] = useState("0"); const totalAmount = useMemo(() => { const fee = parseFloat(monthlyFee) || 0; const days = parseInt(absentDays) || 0; if (fee <= 0 || days < 0) return fee; const deductionPerDay = fee / 30; return Math.max(0, fee - (deductionPerDay * days)); }, [monthlyFee, absentDays]); return ( <Card className="shadow-card bg-gradient-card"><CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="w-5 h-5" /> Fees Calculator</CardTitle></CardHeader><CardContent className="space-y-4"><div><Label>Monthly Fee</Label><Input type="number" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} /></div><div><Label>Absent Days</Label><Input type="number" value={absentDays} onChange={e => setAbsentDays(e.target.value)} /></div><div className="pt-2 border-t"><div className="flex justify-between items-center"><span className="text-muted-foreground">Total Payable</span><strong className="text-lg">{formatAmount(totalAmount)}</strong></div></div></CardContent></Card> );};
const MonthlyPaymentCalendar = ({ transactions }: { transactions: PaymentTransaction[] }) => { const [year, setYear] = useState(new Date().getFullYear()); const monthlyStatuses = useMemo(() => { const paidMonths = new Set<number>(); transactions.forEach(t => { if (t.status === 'completed') { const transactionDate = new Date(t.payment_date); if (transactionDate.getFullYear() === year) paidMonths.add(transactionDate.getMonth()); } }); return months.map((monthName, index) => ({ name: monthName, status: paidMonths.has(index) ? 'paid' : 'pending' })); }, [transactions, year]); return ( <Card className="shadow-card bg-gradient-card"><CardHeader><div className="flex justify-between items-center"><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Monthly Status</CardTitle><div className="flex items-center gap-1"><Button variant="ghost" size="icon" onClick={() => setYear(y => y - 1)}><ChevronLeft className="w-4 h-4" /></Button><span className="font-semibold">{year}</span><Button variant="ghost" size="icon" onClick={() => setYear(y => y + 1)}><ChevronRight className="w-4 h-4" /></Button></div></div></CardHeader><CardContent className="grid grid-cols-3 gap-2">{monthlyStatuses.map(({ name, status }) => (<div key={name} className={`p-2 rounded-lg text-center border ${status === 'paid' ? 'bg-green-100 border-green-200 text-green-800' : 'bg-muted/50'}`}><p className="font-medium text-sm">{name}</p><Badge variant={status === 'paid' ? 'default' : 'secondary'} className={status === 'paid' ? 'bg-green-600' : ''}>{status}</Badge></div>))}</CardContent></Card> );};

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
        if (transactionsRes.error) throw transactionsRes.error;
        setTransactions(transactionsRes.data);
      } catch (e: any) {
        toast.error('Failed to load student data: ' + e.message);
        navigate('/profiles');
      } finally {
        setLoading(false);
      }
    };
    
    setLoading(true);
    fetchAllData();

    const channel = supabase.channel(`student-profile-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `id=eq.${id}` }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `student_id=eq.${id}` }, fetchAllData)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [id, navigate]);
  
  const totalCollected = useMemo(() => transactions.filter(t => t.status === "completed").reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const pendingAmount = useMemo(() => transactions.filter(t => t.status === "pending").reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const daysLeft = useMemo(() => student ? getDaysUntilDue(calculateDueDate(student.registration_date)) : 0, [student]);
  const formatAmount = useCallback((amount: number) => currencyFormatter.format(amount || 0), []);
  const resetForm = useCallback(() => { setFormState(createEmptyFormState()); setIsEditing(false); }, []);
  const handleFormChange = useCallback((update: Partial<PaymentFormState>) => setFormState(prev => ({ ...prev, ...update })), []);

  const handleAddOrUpdatePayment = async () => {
    if (!student) return;
    const amount = Number(formState.amount);
    if (!formState.date || isNaN(amount) || amount <= 0) {
      toast.error("Please provide a valid date and amount.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = { student_id: student.id, payment_date: formState.date, amount, method: formState.method, status: formState.status, notes: formState.notes };
      const { error: txnError } = await supabase.from('transactions').upsert(isEditing ? { id: formState.id!, ...payload } : payload);
      if (txnError) throw txnError;
      toast.success(`Payment ${isEditing ? 'updated' : 'recorded'} successfully!`);
      resetForm();
    } catch (error: any) {
      toast.error("Operation failed: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  const handleEditPayment = (transaction: PaymentTransaction) => { setFormState({ id: transaction.id, date: transaction.payment_date, amount: transaction.amount.toString(), method: transaction.method, status: transaction.status, notes: transaction.notes ?? "" }); setIsEditing(true); };
  const handleDeletePayment = async (transactionId: string) => { if (!window.confirm("Are you sure? This will permanently delete the payment.")) return; setIsSaving(true); try { const { error } = await supabase.from('transactions').delete().eq('id', transactionId); if (error) throw error; toast.success("Payment deleted successfully!"); } catch (error: any) { toast.error("Failed to delete payment: " + error.message); } finally { setIsSaving(false); } };
  const handleUpdateStudent = async (updatedData: Partial<Student>) => { if (!student) return; try { const { error } = await supabase.from('students').update(updatedData).eq('id', student.id); if (error) throw error; toast.success("Student details updated successfully!"); } catch (error: any) { toast.error("Failed to update details: " + error.message); } };
  const handleDeleteStudent = async () => { if (!student) return; try { await supabase.from('transactions').delete().eq('student_id', student.id); const { error } = await supabase.from('students').delete().eq('id', student.id); if (error) throw error; toast.success("Student profile deleted permanently."); navigate('/profiles'); } catch (error: any) { toast.error("Failed to delete student: " + error.message); } };
  const handleExportCsv = () => { if (transactions.length === 0) { toast.info("No payments to export."); return; } const csvData = transactions.map(t => ({ Date: t.payment_date, Amount: t.amount, Method: t.method, Status: t.status, Notes: t.notes || '' })); const csv = Papa.unparse(csvData); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${student?.name}_payments_${new Date().toISOString().split('T')[0]}.csv`; link.click(); toast.success("Payment history exported!"); };

  if (loading) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-4 text-muted-foreground">Loading Student Profile...</p></div>;
  if (!student) return <div className="p-8 text-center"><h2 className="text-2xl font-bold">Student Not Found</h2><p className="text-muted-foreground">The student with the specified ID could not be found.</p><Button onClick={() => navigate('/profiles')} className="mt-4">Back to Profiles</Button></div>;

  return (
    <div className="space-y-6">
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
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Personal Details</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><strong className="text-muted-foreground">Branch:</strong> {student.branch}</div><div><strong className="text-muted-foreground">Phone:</strong> {student.phone}</div>
              <div><strong className="text-muted-foreground">Father:</strong> {student.father_name}</div><div><strong className="text-muted-foreground">Father's Phone:</strong> {student.father_phone}</div>
              <div className="col-span-2"><strong className="text-muted-foreground">Registered On:</strong> {format(new Date(student.registration_date), 'dd MMM, yyyy')}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card bg-gradient-card">
            <CardHeader><div className="flex justify-between items-center"><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Payment History</CardTitle><Button variant="outline" size="sm" onClick={handleExportCsv}><Download className="w-4 h-4 mr-2" /> Export CSV</Button></div></CardHeader>
            <CardContent className="space-y-4">
              <SummaryCards cards={[{ label: "Total Collected", value: formatAmount(totalCollected), tone: "success" }, { label: "Pending Amount", value: formatAmount(pendingAmount), tone: "danger" }, { label: "Transactions", value: `${transactions.length}` },]} />
              <PaymentTable transactions={transactions} onEdit={handleEditPayment} onDelete={handleDeletePayment} formatAmount={formatAmount} />
              <PaymentForm formState={formState} isEditing={isEditing} isSaving={isSaving} onChange={handleFormChange} onSubmit={handleAddOrUpdatePayment} onCancel={resetForm} />
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-6">
          <Card className="shadow-card bg-gradient-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5" /> Fees Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center"><span>Status:</span> <Badge variant={student.status === 'active' ? 'default' : 'destructive'} className={student.status === 'active' ? 'bg-green-100 text-green-700' : ''}>{student.status.replace('_', ' ').toUpperCase()}</Badge></div>
              <div className="flex justify-between"><span>Total Paid:</span> <span className="font-semibold text-green-600">{formatAmount(student.fees_paid)}</span></div>
              <div className="flex justify-between"><span>Amount Due:</span> <span className="font-semibold text-destructive">{formatAmount(student.fees_due)}</span></div>
              <div className="border-t pt-3 flex justify-between"><span>Next Due Date:</span> <span className={daysLeft < 0 ? 'font-semibold text-destructive' : 'font-semibold'}>{daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}</span></div>
            </CardContent>
          </Card>
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