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

const Dashboard = () => {
  const statsData = [
    {
      title: "Total Students",
      value: 247,
      description: "Active registrations",
      icon: Users,
      trend: { value: 12, isPositive: true },
      variant: "default" as const,
    },
    {
      title: "Pending Fees",
      value: "₹48,500",
      description: "Amount due this month",
      icon: DollarSign,
      trend: { value: 8, isPositive: false },
      variant: "warning" as const,
    },
    {
      title: "Overdue Students",
      value: 23,
      description: "Require immediate attention",
      icon: AlertTriangle,
      variant: "destructive" as const,
    },
    {
      title: "Monthly Revenue",
      value: "₹1,85,000",
      description: "Current month collection",
      icon: TrendingUp,
      trend: { value: 15, isPositive: true },
      variant: "success" as const,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      student: "Rajesh Kumar",
      action: "Fee Payment",
      amount: "₹2,500",
      time: "2 hours ago",
      status: "completed",
    },
    {
      id: 2,
      student: "Priya Sharma",
      action: "Registration",
      amount: "-",
      time: "4 hours ago",
      status: "pending",
    },
    {
      id: 3,
      student: "Amit Singh",
      action: "Fee Reminder",
      amount: "₹2,500",
      time: "6 hours ago",
      status: "sent",
    },
  ];

  const overdueStudents = [
    {
      id: 1,
      name: "Rahul Verma",
      branch: "Computer Science",
      daysOverdue: 5,
      amount: "₹2,500",
      phone: "+91 9876543210",
    },
    {
      id: 2,
      name: "Sneha Patel",
      branch: "Electronics",
      daysOverdue: 3,
      amount: "₹2,500",
      phone: "+91 9876543211",
    },
    {
      id: 3,
      name: "Vikash Jha",
      branch: "Mechanical",
      daysOverdue: 7,
      amount: "₹2,500",
      phone: "+91 9876543212",
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
              Latest transactions and updates from the past 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {activity.student[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{activity.student}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{activity.amount}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
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
              {overdueStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-3 bg-background rounded-lg border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-foreground">{student.name}</p>
                    <Badge variant="destructive" className="text-xs">
                      {student.daysOverdue}d overdue
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {student.branch} • {student.amount}
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
                          `https://wa.me/${student.phone.replace(/[^0-9]/g, '')}?text=Hi ${student.name}, your mess fee of ${student.amount} is overdue by ${student.daysOverdue} days. Please pay at your earliest convenience.`
                        )
                      }
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              ))}
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