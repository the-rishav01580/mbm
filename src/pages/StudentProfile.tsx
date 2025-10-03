import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar, Phone, MessageSquare, ArrowLeft, Wallet, User, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateDueDate, getDaysUntilDue, getDueDateStatusMessage } from "@/lib/dateUtils";
import { toast } from "sonner";

interface StudentRow {
  id: string;
  enrollment_number: string;
  name: string;
  phone: string;
  father_name: string;
  father_phone: string;
  branch: string;
  registration_date: string;
  photo_url?: string | null;
  status: string;
  fees_paid: number | null;
  fees_due: number | null;
  created_at: string;
  updated_at: string;
}

interface PaymentRow {
  id: string;
  amount: number;
  method: "cash" | "online";
  status: "completed" | "pending";
  paid_at: string;
}

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newPayment, setNewPayment] = useState<{ amount: string; method: "cash" | "online"; status: "completed" | "pending" }>({ amount: "", method: "cash", status: "completed" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      if (!id) return;
      try {
        const [{ data: sData, error: sErr }, { data: pData, error: pErr }] = await Promise.all([
          supabase.from('students').select('*').eq('id', id).single(),
          supabase.from('payments').select('*').eq('student_id', id).order('paid_at', { ascending: false })
        ]);
        if (sErr) throw sErr;
        setStudent(sData as StudentRow);
        if (pErr && (pErr as any)?.code !== '42P01') throw pErr; // ignore table-missing here
        setPayments((pData || []) as PaymentRow[]);
      } catch (e: any) {
        toast.error('Failed to load student: ' + e.message);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    setLoading(true);
    fetchAll();

    // Set up real-time subscription for student updates
    const studentSubscription = supabase
      .channel('student-profile')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'students', filter: `id=eq.${id}` },
          () => fetchAll())
      .subscribe();

    // Set up real-time subscription for payment updates
    const paymentSubscription = supabase
      .channel('student-payments')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'payments', filter: `student_id=eq.${id}` },
          () => fetchAll())
      .subscribe();

    // Auto-refresh every minute to keep the countdown accurate
    const refreshInterval = setInterval(fetchAll, 60000);

    return () => {
      studentSubscription.unsubscribe();
      paymentSubscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [id]);

  const dueDate = useMemo(() => student ? calculateDueDate(student.registration_date) : '', [student]);
  const daysLeft = useMemo(() => dueDate ? getDaysUntilDue(dueDate) : 0, [dueDate]);

  const handleRecordPayment = async () => {
    if (!student) return;
    const amountNum = Number(newPayment.amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) {
      toast.error('You must be signed in');
      return;
    }
    setSaving(true);
    // Start a transaction
    const { error: paymentError } = await supabase.from('payments').insert({
      student_id: student.id,
      amount: amountNum,
      method: newPayment.method,
      status: newPayment.status,
      paid_at: new Date().toISOString()
    });

    setSaving(false);
    if (paymentError) {
      toast.error('Failed to record payment: ' + paymentError.message);
      return;
    }

    // Update student's payment status
    const dueDate = calculateDueDate(student.registration_date);
    const daysLeft = getDaysUntilDue(dueDate);
    const newStatus = daysLeft < 0 ? 'overdue' : 'active';

    const { error: updateError } = await supabase
      .from('students')
      .update({
        fees_paid: (student.fees_paid || 0) + amountNum,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', student.id);

    if (updateError) {
      toast.error('Failed to update student status: ' + updateError.message);
      return;
    }

    toast.success('Payment recorded');
    setNewPayment({ amount: "", method: "cash", status: "completed" });
    
    // Refresh payments
    const { data: pData } = await supabase.from('payments').select('*').eq('student_id', student.id).order('paid_at', { ascending: false });
    setPayments((pData || []) as PaymentRow[]);
    
    // Refresh student data
    const { data: sData } = await supabase.from('students').select('*').eq('id', student.id).single();
    if (sData) setStudent(sData as StudentRow);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">Loading...</div>
    );
  }
  if (!student) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="inline-flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
        <p className="text-muted-foreground">Student not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="inline-flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
          <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.open(`tel:${student.phone}`)} className="inline-flex items-center gap-2"><Phone className="w-4 h-4" /> Call</Button>
          <Button variant="outline" onClick={() => window.open(`https://wa.me/${(student.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${student.name}, this is regarding your mess fees.`)}`)} className="inline-flex items-center gap-2"><MessageSquare className="w-4 h-4" /> WhatsApp</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Details & Payments */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-4 h-4" /> Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Enrollment:</span> <span className="font-medium">{student.enrollment_number}</span></div>
                <div><span className="text-muted-foreground">Branch:</span> <span className="font-medium">{student.branch}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{student.phone}</span></div>
                <div><span className="text-muted-foreground">Father:</span> <span className="font-medium">{student.father_name} ({student.father_phone})</span></div>
                <div className="flex items-center gap-2"><Calendar className="w-3 h-3 text-muted-foreground" /> <span className="text-muted-foreground">Registered:</span> <span className="font-medium">{new Date(student.registration_date).toLocaleDateString('en-IN')}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className="ml-1">{student.status}</Badge></div>
              </div>
              {student.photo_url && (
                <div>
                  <img src={student.photo_url} alt={student.name} className="w-28 h-28 rounded-full object-cover cursor-zoom-in" onClick={() => setPreviewOpen(true)} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Payment History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleDateString('en-IN')} • {p.method}</p>
                  </div>
                  <Badge variant={p.status === 'completed' ? 'default' : 'secondary'}>{p.status}</Badge>
                </div>
              ))}

              <div className="mt-2 p-3 border rounded-lg space-y-3">
                <div className="grid sm:grid-cols-3 gap-2">
                  <div>
                    <Label>Amount</Label>
                    <Input type="number" min="0" step="0.01" value={newPayment.amount} onChange={(e) => setNewPayment((v) => ({ ...v, amount: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Method</Label>
                    <Select value={newPayment.method} onValueChange={(v: "cash" | "online") => setNewPayment((p) => ({ ...p, method: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={newPayment.status} onValueChange={(v: "completed" | "pending") => setNewPayment((p) => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleRecordPayment} disabled={saving}>{saving ? 'Saving...' : 'Record Payment'}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Fees summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wallet className="w-4 h-4" /> Fees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fees Paid</span>
                <span className="font-semibold">₹{Number(student.fees_paid || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fees Due</span>
                <span className="font-semibold text-destructive">₹{Number(student.fees_due || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next Due</span>
                <span className={daysLeft < 0 ? 'font-semibold text-destructive' : 'font-semibold'}>{getDueDateStatusMessage(dueDate)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 sm:p-4">
          <div className="w-full h-full flex items-center justify-center">
            <img src={student.photo_url || ''} alt={student.name} className="max-w-full max-h-[80vh] rounded-md" onClick={() => setPreviewOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentProfile;


