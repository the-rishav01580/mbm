import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, Phone, MessageSquare, DollarSign, AlertTriangle, Calendar, User, Search, Loader2
} from "lucide-react";
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
      
      // Fetch all students and all transactions
      const [studentsRes, transactionsRes] = await Promise.all([
        supabase
          .from('students')
          .select('*')
          .lte('due_date', today), // Students with due date passed or today
        supabase
          .from('transactions')
          .select('*')
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

    // Real-time subscriptions
    const channel = supabase
      .channel('fees-due-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Calculate students with dues
  const studentsDue = useMemo(() => {
    // Create a map of student pending amounts
    const studentPendingAmounts = new Map<string, number>();
    
    transactions.forEach(transaction => {
      if (transaction.status === 'pending') {
        const current = studentPendingAmounts.get(transaction.student_id) || 0;
        studentPendingAmounts.set(transaction.student_id, current + transaction.amount);
      }
    });

    // Map students to StudentDue format
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
      // Filter to only show students with pending amount or overdue
      .filter(s => s.amountDue > 0 || s.daysOverdue > 0);

    return mappedData;
  }, [students, transactions]);

  const sortedStudents = useMemo(() => {
    return [...studentsDue].sort((a, b) => {
      // First sort by amount due (higher amounts first)
      if (a.amountDue !== b.amountDue) {
        return b.amountDue - a.amountDue;
      }
      // Then by days overdue
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fees Due</h1>
          <p className="text-muted-foreground">Students with pending payments (sorted by amount and urgency)</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Pending Amount</p>
          <p className="text-2xl font-bold text-destructive">{formatAmount(totalAmountDue)}</p>
        </div>
      </div>

      <Card className="shadow-card bg-gradient-card">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, enrollment or phone..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => toast.info("Feature coming soon!")}>
                <MessageSquare className="w-4 h-4 mr-2" /> Send All Reminders
              </Button>
              <Button onClick={() => toast.info("Feature coming soon!")}>
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
            <CardContent className="pt-6">
              <div className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                </div>
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center overflow-hidden">
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-foreground">{student.name}</h3>
                    {getDaysOverdueBadge(student.daysOverdue)}
                  </div>
                  <div className="grid gap-x-4 gap-y-1 md:grid-cols-3 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground/80">Enrollment:</span> {student.enrollmentNumber}
                    </div>
                    <div>
                      <span className="font-medium text-foreground/80">Branch:</span> {student.branch}
                    </div>
                    <div>
                      <span className="font-medium text-foreground/80">Due Date:</span> {
                        student.dueDate !== 'N/A' 
                          ? format(new Date(student.dueDate), 'dd MMM, yyyy')
                          : 'Not Set'
                      }
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Due</p>
                    <p className="text-xl font-bold text-destructive">
                      {formatAmount(student.amountDue)}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCall(student.phone)}
                      disabled={!student.phone || student.phone === 'N/A'}
                    >
                      <Phone className="w-3 h-3 mr-1" /> Call
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleWhatsApp(student)}
                      disabled={!student.phone || student.phone === 'N/A'}
                    >
                      <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp
                    </Button>
                    <Button size="sm" onClick={() => handleRecordPayment(student.id)}>
                      <DollarSign className="w-3 h-3 mr-1" /> Pay
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-4 pl-[64px]">
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