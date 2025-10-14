import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, IndianRupeeIcon, AlertTriangle, TrendingUp, Calendar, Phone, MessageSquare, Clock, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfMonth, format } from "date-fns";

interface Student {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
  branch: string | null;
  due_date: string | null;
  enrollment_number: string | null;
}

interface Transaction {
  id: string;
  payment_date: string;
  amount: number;
  status: 'completed' | 'pending';
  student_id: string;
}

const Dashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      const [studentsRes, transactionsRes] = await Promise.all([
        supabase.from('students').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*')
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (transactionsRes.error && transactionsRes.error.code !== 'PGRST116') throw transactionsRes.error;

      setStudents(studentsRes.data || []);
      setTransactions(transactionsRes.data || []);
    } catch (error: any) {
      console.error("Dashboard data error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Real-time subscriptions
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchDashboardData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  const totals = useMemo(() => {
    const totalStudents = students.length;
    
    // Calculate pending fees from pending transactions
    const totalPendingFees = transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Calculate overdue students based on due_date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueStudents = students.filter(student => {
      if (!student.due_date) return false;
      const dueDate = new Date(student.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      // Check if student has any pending payments
      const hasPendingPayments = transactions.some(
        t => t.student_id === student.id && t.status === 'pending'
      );
      
      return dueDate < today || hasPendingPayments;
    });

    // Calculate monthly revenue (completed transactions this month)
    const startOfThisMonth = startOfMonth(new Date());
    const monthlyRevenue = transactions
      .filter(t => {
        const transactionDate = new Date(t.payment_date);
        return t.status === 'completed' && transactionDate >= startOfThisMonth;
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Get student payment totals for recent activity
    const studentPayments = new Map<string, number>();
    transactions
      .filter(t => t.status === 'completed')
      .forEach(t => {
        const current = studentPayments.get(t.student_id) || 0;
        studentPayments.set(t.student_id, current + Number(t.amount || 0));
      });

    return {
      totalStudents,
      totalPendingFees,
      overdueCount: overdueStudents.length,
      monthlyRevenue,
      overdueStudents,
      studentPayments
    };
  }, [students, transactions]);

  const statsData = [
    { 
      title: "Total Students", 
      value: totals.totalStudents, 
      description: "Active records", 
      icon: Users, 
      variant: "default" as const 
    },
    { 
      title: "Pending Fees", 
      value: `₹${totals.totalPendingFees.toLocaleString('en-IN')}`, 
      description: "Total pending amount", 
      icon: IndianRupeeIcon, 
      variant: "warning" as const 
    },
    { 
      title: "Overdue Students", 
      value: totals.overdueCount, 
      description: "Require attention", 
      icon: AlertTriangle, 
      variant: "destructive" as const 
    },
    { 
      title: "Monthly Revenue", 
      value: `₹${totals.monthlyRevenue.toLocaleString('en-IN')}`, 
      description: "This month (Completed)", 
      icon: TrendingUp, 
      variant: "success" as const 
    },
  ];

  const handleWhatsApp = (student: Student, pendingAmount: number) => {
    try {
      let phoneNumber = (student.phone || '').replace(/[^0-9]/g, '');
      if (phoneNumber.length === 10) phoneNumber = '91' + phoneNumber;
      
      const message = `Hi ${student.name}, your mess fee of ₹${pendingAmount.toLocaleString('en-IN')} is pending. Please pay at your earliest convenience. Thank you!`;
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error("Failed to open WhatsApp");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            {format(new Date(), 'EEEE, dd MMMM yyyy')}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" /> Recent Activity
            </CardTitle>
            <CardDescription>Latest student registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.slice(0, 5).map((student) => {
                const paidAmount = totals.studentPayments.get(student.id) || 0;
                return (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {student.name?.[0]?.toUpperCase() || 'S'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.enrollment_number || 'No enrollment'} • {format(new Date(student.created_at), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        ₹{paidAmount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-muted-foreground">Paid total</p>
                    </div>
                  </div>
                );
              })}
              {students.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No students registered yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Urgent Actions
            </CardTitle>
            <CardDescription>Students with overdue payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {totals.overdueStudents.slice(0, 5).map((student) => {
                // Calculate pending amount for this student
                const pendingAmount = transactions
                  .filter(t => t.student_id === student.id && t.status === 'pending')
                  .reduce((sum, t) => sum + Number(t.amount || 0), 0);
                
                if (pendingAmount === 0) return null;
                
                return (
                  <div key={student.id} className="p-3 bg-background rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm text-foreground">{student.name}</p>
                      <Badge variant="destructive" className="text-xs">
                        ₹{pendingAmount.toLocaleString('en-IN')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {student.branch || 'No branch'}
                    </p>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-7 text-xs" 
                        onClick={() => student.phone && window.open(`tel:${student.phone}`)}
                        disabled={!student.phone}
                      >
                        <Phone className="w-3 h-3 mr-1" /> Call
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-7 text-xs" 
                        onClick={() => handleWhatsApp(student, pendingAmount)}
                        disabled={!student.phone}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp
                      </Button>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
              {totals.overdueStudents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No overdue payments. Great job!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card bg-gradient-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              className="h-auto p-4 flex flex-col gap-2" 
              variant="outline" 
              onClick={() => navigate('/registration')}
            >
              <Users className="w-6 h-6" />
              <span>Add New Student</span>
            </Button>
            <Button 
              className="h-auto p-4 flex flex-col gap-2" 
              variant="outline" 
              onClick={() => navigate('/profiles')}
            >
              <IndianRupeeIcon className="w-6 h-6" />
              <span>View Students</span>
            </Button>
            <Button 
              className="h-auto p-4 flex flex-col gap-2" 
              variant="outline" 
              onClick={() => navigate('/fees-due')}
            >
              <MessageSquare className="w-6 h-6" />
              <span>Send Reminders</span>
            </Button>
            <Button 
              className="h-auto p-4 flex flex-col gap-2" 
              variant="outline" 
              onClick={() => navigate('/analytics')}
            >
              <TrendingUp className="w-6 h-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;