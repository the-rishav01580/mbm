import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, DollarSign, AlertTriangle, TrendingUp, Calendar, Phone, MessageSquare, Clock, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfMonth } from "date-fns";

// Interface for Student data
interface Student {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
  branch: string | null;
  fees_due: number | null;
  fees_paid: number | null;
}

// FIX: Renamed 'date' to 'payment_date' to match the database schema
interface Transaction {
  id: string;
  payment_date: string; // "YYYY-MM-DD"
  amount: number;
  status: 'completed' | 'pending';
}

const Dashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // FIX: Request 'payment_date' instead of 'date' from the transactions table
        const [studentsResponse, transactionsResponse] = await Promise.all([
          supabase.from('students').select('*').order('created_at', { ascending: false }),
          supabase.from('transactions').select('id, payment_date, amount, status')
        ]);

        if (studentsResponse.error) throw studentsResponse.error;
        if (transactionsResponse.error) throw transactionsResponse.error;

        setStudents(studentsResponse.data || []);
        setTransactions(transactionsResponse.data || []);

      } catch (e: any) {
        toast.error("Failed to load dashboard data: " + e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const totals = useMemo(() => {
    const totalStudents = students.length;
    const totalFeesDue = students.reduce((sum, s) => sum + (Number(s.fees_due) || 0), 0);
    const overdue = students.filter(s => (Number(s.fees_due) || 0) > 0);

    const now = new Date();
    const startOfThisMonth = startOfMonth(now);

    const totalFeesPaidThisMonth = transactions
      .filter(t => {
        // FIX: Use 'payment_date' for the calculation
        const transactionDate = new Date(t.payment_date);
        return t.status === 'completed' && transactionDate >= startOfThisMonth;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      totalStudents,
      totalFeesDue,
      overdueCount: overdue.length,
      monthlyRevenue: totalFeesPaidThisMonth,
      overdueStudents: overdue,
    };
  }, [students, transactions]);

  const statsData = [
    { title: "Total Students", value: totals.totalStudents, description: "Active records", icon: Users, variant: "default" as const },
    { title: "Pending Fees", value: `₹${totals.totalFeesDue.toLocaleString('en-IN')}`, description: "Total amount due", icon: DollarSign, variant: "warning" as const },
    { title: "Overdue Students", value: totals.overdueCount, description: "Require attention", icon: AlertTriangle, variant: "destructive" as const },
    { title: "Monthly Revenue", value: `₹${totals.monthlyRevenue.toLocaleString('en-IN')}`, description: "This month (Completed)", icon: TrendingUp, variant: "success" as const },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4 text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your mess management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Rest of the component's JSX is fine and does not need changes */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card bg-gradient-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Recent Activity</CardTitle><CardDescription>Latest student registrations</CardDescription></CardHeader>
          <CardContent><div className="space-y-4">{students.slice(0, 5).map((s) => (<div key={s.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center"><span className="text-white text-sm font-medium">{s.name?.[0]?.toUpperCase() || 'S'}</span></div><div><p className="font-medium text-foreground">{s.name}</p><p className="text-sm text-muted-foreground">Enrolled on {new Date(s.created_at).toLocaleDateString('en-IN')}</p></div></div><div className="text-right"><p className="font-medium text-foreground">₹{Number(s.fees_paid || 0).toLocaleString('en-IN')}</p><p className="text-xs text-muted-foreground">Paid so far</p></div></div>))}{students.length === 0 && <p className="text-sm text-muted-foreground">No recent student registrations.</p>}</div></CardContent>
        </Card>
        <Card className="shadow-card bg-gradient-card">
          <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Urgent Actions</CardTitle><CardDescription>Students with pending fees</CardDescription></CardHeader>
          <CardContent><div className="space-y-3">{totals.overdueStudents.slice(0, 5).map((student) => { const amountDue = Number(student.fees_due) || 0; return (<div key={student.id} className="p-3 bg-background rounded-lg border border-border"><div className="flex items-center justify-between mb-2"><p className="font-medium text-sm text-foreground">{student.name}</p><Badge variant="destructive" className="text-xs">Due ₹{amountDue.toLocaleString('en-IN')}</Badge></div><p className="text-xs text-muted-foreground mb-2">{student.branch}</p><div className="flex gap-1"><Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => window.open(`tel:${student.phone}`)}><Phone className="w-3 h-3 mr-1" /> Call</Button><Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => window.open(`https://wa.me/${(student.phone || '').replace(/[^0-P]/g, '')}?text=Hi ${student.name}, your mess fee of ₹${amountDue.toLocaleString('en-IN')} is due. Please pay soon.`)}><MessageSquare className="w-3 h-3 mr-1" /> WhatsApp</Button></div></div>); })}{totals.overdueStudents.length === 0 && <p className="text-sm text-muted-foreground">No overdue students. Great job!</p>}</div></CardContent>
        </Card>
      </div>
      <Card className="shadow-card bg-gradient-card">
        <CardHeader><CardTitle>Quick Actions</CardTitle><CardDescription>Common tasks and shortcuts</CardDescription></CardHeader>
        <CardContent><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Button className="h-auto p-4 flex flex-col gap-2" variant="outline" onClick={() => navigate('/registration')}><Users className="w-6 h-6" /><span>Add New Student</span></Button><Button className="h-auto p-4 flex flex-col gap-2" variant="outline" onClick={() => navigate('/profiles')}><DollarSign className="w-6 h-6" /><span>Record Payment</span></Button><Button className="h-auto p-4 flex flex-col gap-2" variant="outline" onClick={() => navigate('/fees-due')}><MessageSquare className="w-6 h-6" /><span>Send Reminders</span></Button> </div></CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;