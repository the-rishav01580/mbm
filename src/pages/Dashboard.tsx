import { useEffect, useMemo, useState } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Phone,
  MessageSquare,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Dashboard = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setStudents(data || []);
      } catch (e: any) {
        toast.error("Failed to load dashboard data: " + e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const totals = useMemo(() => {
    const totalStudents = students.length;
    const totalFeesDue = students.reduce((sum, s) => sum + (Number(s.fees_due) || 0), 0);
    const totalFeesPaidThisMonth = 0; // Placeholder until payments table exists
    const overdue = students.filter(s => (Number(s.fees_due) || 0) > 0);
    return {
      totalStudents,
      totalFeesDue,
      overdueCount: overdue.length,
      monthlyRevenue: totalFeesPaidThisMonth,
      overdueStudents: overdue,
    };
  }, [students]);

  const statsData = [
    {
      title: "Total Students",
      value: totals.totalStudents,
      description: "Active records",
      icon: Users,
      variant: "default" as const,
    },
    {
      title: "Pending Fees",
      value: `₹${totals.totalFeesDue.toLocaleString('en-IN')}`,
      description: "Amount due",
      icon: DollarSign,
      variant: "warning" as const,
    },
    {
      title: "Overdue Students",
      value: totals.overdueCount,
      description: "Require attention",
      icon: AlertTriangle,
      variant: "destructive" as const,
    },
    {
      title: "Monthly Revenue",
      value: `₹${totals.monthlyRevenue.toLocaleString('en-IN')}`,
      description: "This month",
      icon: TrendingUp,
      variant: "success" as const,
    },
  ];

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
            {new Date().toLocaleDateString('en-IN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {s.name?.[0] || 'S'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{s.name}</p>
                      <p className="text-sm text-muted-foreground">Enrolled {new Date(s.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">₹{Number(s.fees_paid || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">Paid total</p>
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activity yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Urgent Actions */}
        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Urgent Actions
            </CardTitle>
            <CardDescription>
              Students requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {totals.overdueStudents.map((student: any) => {
                const amountDue = Number(student.fees_due) || 0;
                return (
                  <div key={student.id} className="p-3 bg-background rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm text-foreground">{student.name}</p>
                      <Badge variant="destructive" className="text-xs">
                        Due ₹{amountDue.toLocaleString('en-IN')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {student.branch}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs"
                        onClick={() => window.open(`tel:${student.phone}`)}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs"
                        onClick={() => 
                          window.open(
                            `https://wa.me/${(student.phone || '').replace(/[^0-9]/g, '')}?text=Hi ${student.name}, your mess fee of ₹${amountDue.toLocaleString('en-IN')} is due. Please pay at your earliest convenience.`
                          )
                        }
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                );
              })}
              {totals.overdueStudents.length === 0 && (
                <p className="text-sm text-muted-foreground">No overdue students. Great job!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card bg-gradient-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts for mess management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button className="h-auto p-4 flex flex-col gap-2" variant="outline">
              <Users className="w-6 h-6" />
              <span>Add New Student</span>
            </Button>
            <Button className="h-auto p-4 flex flex-col gap-2" variant="outline">
              <DollarSign className="w-6 h-6" />
              <span>Record Payment</span>
            </Button>
            <Button className="h-auto p-4 flex flex-col gap-2" variant="outline">
              <MessageSquare className="w-6 h-6" />
              <span>Send Reminders</span>
            </Button>
            <Button className="h-auto p-4 flex flex-col gap-2" variant="outline">
              <TrendingUp className="w-6 h-6" />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;