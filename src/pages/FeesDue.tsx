import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Phone, MessageSquare, DollarSign, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

interface Student {
  id: string;
  name: string;
  enrollment_number: string;
  branch: string;
  phone: string;
  due_date: string;
  photo_url: string | null;
  updated_at: string;
  created_at: string;
}

interface Transaction {
  id: string;
  student_id: string;
  amount: number;
  status: 'completed' | 'pending';
  payment_date: string;
}

interface StudentDue {
  id: string;
  name: string;
  enrollmentNumber: string;
  branch: string;
  phone: string;
  amountDue: number;
  dueDate: string;
  daysOverdue: number;
  lastReminder: string;
  photo: string | null;
}

// Helper function to calculate days until due
const getDaysUntilDue = (dueDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return differenceInDays(due, today);
};

// Helper function to format amount in Indian currency
const formatAmount = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Helper function to get WhatsApp URL
const getWhatsAppUrl = (student: StudentDue): string => {
  let phoneNumber = student.phone.replace(/[^0-9]/g, '');
  if (phoneNumber.length === 10) {
    phoneNumber = '91' + phoneNumber;
  }
  
  let message: string;
  if (student.amountDue > 0) {
    const amountDue = formatAmount(student.amountDue);
    if (student.daysOverdue > 0) {
      message = `Hi ${student.name}, this is a friendly reminder from the mess management. Your fee of ₹${amountDue} is overdue by ${student.daysOverdue} days. Please pay at your earliest convenience to avoid any inconvenience. Thank you!`;
    } else {
      message = `Hi ${student.name}, this is a friendly reminder from the mess management. Your fee of ₹${amountDue} is due today. Please pay at your earliest convenience. Thank you!`;
    }
  } else {
    message = `Hi ${student.name}, this is a friendly reminder from the MAA BHAGVATI MESS. Your monthly mess fee is due. Please pay at your earliest convenience. Thank you!`;
  }
  
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
};

const FeesDue = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [studentsRes, transactionsRes] = await Promise.all([
        supabase.from('students').select('*').lte('due_date', today),
        supabase.from('transactions').select('*')
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (transactionsRes.error && transactionsRes.error.code !== 'PGRST116') throw transactionsRes.error;

      setStudents(studentsRes.data || []);
      setTransactions(transactionsRes.data || []);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load fees due data');
      setStudents([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData();

    const channel = supabase
      .channel('fees-due-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const studentsDue = useMemo(() => {
    const studentPendingAmounts = new Map<string, number>();
    transactions.forEach(transaction => {
      if (transaction.status === 'pending') {
        const current = studentPendingAmounts.get(transaction.student_id) || 0;
        studentPendingAmounts.set(transaction.student_id, current + transaction.amount);
      }
    });

    const mappedData: StudentDue[] = students
      .map(student => {
        const pendingAmount = studentPendingAmounts.get(student.id) || 0;
        const daysLeft = student.due_date ? getDaysUntilDue(student.due_date) : -999;
        const daysOverdue = Math.max(0, -daysLeft);
        
        return {
          id: student.id,
          name: student.name || 'N/A',
          enrollmentNumber: student.enrollment_number || 'N/A',
          branch: student.branch || 'N/A',
          phone: student.phone || 'N/A',
          amountDue: pendingAmount,
          dueDate: student.due_date || 'N/A',
          daysOverdue,
          lastReminder: student.updated_at || student.created_at,
          photo: student.photo_url || null,
        };
      })
      .filter(s => s.amountDue > 0 || s.daysOverdue > 0);

    return mappedData;
  }, [students, transactions]);

  const sortedStudents = useMemo(() => {
    return [...studentsDue].sort((a, b) => {
      if (a.amountDue !== b.amountDue) return b.amountDue - a.amountDue;
      return b.daysOverdue - a.daysOverdue;
    });
  }, [studentsDue]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return sortedStudents;
    const term = searchTerm.toLowerCase();
    return sortedStudents.filter(student =>
      student.name.toLowerCase().includes(term) ||
      student.enrollmentNumber.toLowerCase().includes(term) ||
      student.phone.includes(term)
    );
  }, [sortedStudents, searchTerm]);
  
  const getDaysOverdueBadge = (days: number) => {
    if (days >= 30) return <Badge variant="destructive">Critical ({days}d overdue)</Badge>;
    if (days >= 7) return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">High ({days}d overdue)</Badge>;
    if (days >= 1) return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Medium ({days}d overdue)</Badge>;
    return <Badge className="bg-green-500 text-white hover:bg-green-600">Due Today</Badge>;
  };

  const getUrgencyColor = (days: number) => {
    if (days >= 30) return "rgb(239 68 68)";
    if (days >= 7) return "rgb(249 115 22)";
    if (days >= 1) return "rgb(234 179 8)";
    return "rgb(34 197 94)";
  };

  const handleRecordPayment = (studentId: string) => {
    navigate(`/students/${studentId}`);
  };

  const handleCall = (phone: string) => {
    if (phone && phone !== 'N/A') {
      window.open(`tel:${phone}`, '_self');
    } else {
      toast.error("Phone number not available");
    }
  };

  const handleWhatsApp = (student: StudentDue) => {
    if (student.phone && student.phone !== 'N/A') {
      try {
        window.open(getWhatsAppUrl(student), '_blank', 'noopener,noreferrer');
      } catch (error) {
        toast.error("Failed to open WhatsApp");
      }
    } else {
      toast.error("Phone number not available");
    }
  };

  const totalAmountDue = useMemo(() => {
    return filteredStudents.reduce((sum, student) => sum + student.amountDue, 0);
  }, [filteredStudents]);

  return (
    <div className="space-y-6 px-3 sm:px-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Fees Due</h1>
          <p className="text-muted-foreground">Students with pending payments (sorted by amount and urgency)</p>
        </div>
        <div className="sm:text-right">
          <p className="text-sm text-muted-foreground">Total Pending Amount</p>
          <p className="text-2xl font-bold text-destructive">{formatAmount(totalAmountDue)}</p>
        </div>
      </div>

      <Card className="shadow-card bg-gradient-card">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, enrollment or phone..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10"
              />
            </div>
            {/* Mobile: small buttons, single line */}
            <div className="flex items-center gap-2 flex-nowrap overflow-x-auto whitespace-nowrap -mx-1 px-1 md:overflow-visible md:mx-0 md:px-0">
              <Button
                variant="outline"
                className="h-8 px-2 text-xs w-auto md:h-10 md:px-4 md:text-sm"
                onClick={() => toast.info("Feature coming soon!")}
              >
                <MessageSquare className="w-4 h-4 mr-2" /> Send All Reminders
              </Button>
              <Button
                className="h-8 px-2 text-xs w-auto md:h-10 md:px-4 md:text-sm"
                onClick={() => toast.info("Feature coming soon!")}
              >
                <DollarSign className="w-4 h-4 mr-2" /> Bulk Payment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </div>
        )}

        {!loading && filteredStudents.map((student, index) => (
          <Card
            key={student.id}
            className="shadow-card hover:shadow-hover transition-all duration-200 bg-gradient-card"
            style={{ borderLeft: `4px solid ${getUrgencyColor(student.daysOverdue)}` }}
          >
            <CardContent className="pt-6 relative">
              {/* Mobile: badge on top-right corner */}
              <div className="md:hidden absolute top-2 right-2 z-10">
                {getDaysOverdueBadge(student.daysOverdue)}
              </div>

              <div className="flex flex-col gap-4 md:grid md:grid-cols-[auto_auto_1fr_auto] md:items-center">
                {/* Serial number (improved on mobile) */}
                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white flex items-center justify-center font-extrabold text-[13px] shadow ring-1 ring-white/40 select-none md:w-8 md:h-8 md:rounded-full md:bg-gradient-primary md:font-bold md:text-sm">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                </div>

                {/* Avatar: hidden on mobile, shown on desktop */}
                <div className="hidden md:flex w-12 h-12 bg-muted rounded-full items-center justify-center overflow-hidden">
                  {student.photo ? (
                    <img 
                      src={student.photo} 
                      alt={student.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<span class="text-muted-foreground font-medium">${student.name.split(' ').map(n => n[0]).join('')}</span>`;
                      }}
                    />
                  ) : (
                    <span className="text-muted-foreground font-medium">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="w-full md:flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">{student.name}</h3>
                    {/* Inline badge only on md+ */}
                    <div className="hidden md:block">
                      {getDaysOverdueBadge(student.daysOverdue)}
                    </div>
                  </div>
                  <div className="grid gap-x-4 gap-y-1 text-sm text-muted-foreground md:grid-cols-3">
                    <div className="truncate">
                      <span className="font-medium text-foreground/80">Enrollment:</span> {student.enrollmentNumber}
                    </div>
                    {/* Branch removed on mobile */}
                    <div className="hidden md:block truncate">
                      <span className="font-medium text-foreground/80">Branch:</span> {student.branch}
                    </div>
                    <div className="whitespace-nowrap">
                      <span className="font-medium text-foreground/80">Due Date:</span>{" "}
                      {student.dueDate !== 'N/A' 
                        ? format(new Date(student.dueDate), 'dd MMM, yyyy')
                        : 'Not Set'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="md:text-right space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Due</p>
                    <p className="text-xl font-bold text-destructive">
                      {formatAmount(student.amountDue)}
                    </p>
                  </div>

                  {/* Mobile: Call + WhatsApp small and on one line */}
                  <div className="flex items-center gap-2 md:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs w-auto md:h-8 md:px-3 md:text-sm"
                      onClick={() => handleCall(student.phone)}
                      disabled={!student.phone || student.phone === 'N/A'}
                    >
                      <Phone className="w-4 h-4 mr-2" /> Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs w-auto md:h-8 md:px-3 md:text-sm"
                      onClick={() => handleWhatsApp(student)}
                      disabled={!student.phone || student.phone === 'N/A'}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                    </Button>
                  </div>

                  {/* Keep Pay separate; full-width on mobile, inline on md+ */}
                  <div className="flex">
                    <Button
                      size="sm"
                      className="h-10 w-full md:h-8 md:w-auto md:ml-auto"
                      onClick={() => handleRecordPayment(student.id)}
                    >
                      <DollarSign className="w-4 h-4 mr-2" /> Pay
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 md:pl-[64px]">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Urgency Level</span>
                  <span>{student.daysOverdue} days overdue</span>
                </div>
                <Progress 
                  value={Math.min((student.daysOverdue / 30) * 100, 100)} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && filteredStudents.length === 0 && (
        <Card className="shadow-card bg-gradient-card">
          <CardContent className="py-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">All Clear!</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "No students found matching your search." 
                : "No students have pending payments at the moment."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeesDue;