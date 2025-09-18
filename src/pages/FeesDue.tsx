import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Phone, 
  MessageSquare,
  DollarSign,
  AlertTriangle,
  Calendar,
  User,
  Search,
  Filter
} from "lucide-react";

const FeesDue = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for students with fees due - will be replaced with Supabase data
  const studentsDue = [
    {
      id: 1,
      name: "Rahul Verma",
      enrollmentNumber: "20CS001",
      branch: "Computer Science",
      phone: "+91 9876543210",
      fatherPhone: "+91 9876543211",
      amountDue: 2500,
      dueDate: "2024-01-25",
      daysOverdue: 5,
      lastReminder: "2024-01-20",
      photo: null,
    },
    {
      id: 2,
      name: "Sneha Patel",
      enrollmentNumber: "20EC002", 
      branch: "Electronics",
      phone: "+91 9876543212",
      fatherPhone: "+91 9876543213",
      amountDue: 2500,
      dueDate: "2024-01-27",
      daysOverdue: 3,
      lastReminder: "2024-01-22",
      photo: null,
    },
    {
      id: 3,
      name: "Vikash Jha",
      enrollmentNumber: "20ME003",
      branch: "Mechanical",
      phone: "+91 9876543214",
      fatherPhone: "+91 9876543215",
      amountDue: 2500,
      dueDate: "2024-01-23",
      daysOverdue: 7,
      lastReminder: "2024-01-18",
      photo: null,
    },
    {
      id: 4,
      name: "Amit Singh",
      enrollmentNumber: "20IT004",
      branch: "Information Technology",
      phone: "+91 9876543216",
      fatherPhone: "+91 9876543217",
      amountDue: 2500,
      dueDate: "2024-01-29",
      daysOverdue: 1,
      lastReminder: "2024-01-25",
      photo: null,
    },
    {
      id: 5,
      name: "Priya Sharma",
      enrollmentNumber: "20CE005",
      branch: "Civil Engineering",
      phone: "+91 9876543218",
      fatherPhone: "+91 9876543219",
      amountDue: 2500,
      dueDate: "2024-01-21",
      daysOverdue: 9,
      lastReminder: "2024-01-16",
      photo: null,
    },
  ];

  // Sort by days overdue (ascending - most urgent first)
  const sortedStudents = studentsDue.sort((a, b) => b.daysOverdue - a.daysOverdue);

  const filteredStudents = sortedStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDaysOverdueBadge = (days: number) => {
    if (days >= 7) {
      return <Badge variant="destructive">Critical ({days}d overdue)</Badge>;
    } else if (days >= 3) {
      return <Badge variant="destructive" className="bg-orange-500">High ({days}d overdue)</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-yellow-500 text-white">Medium ({days}d overdue)</Badge>;
    }
  };

  const getUrgencyColor = (days: number) => {
    if (days >= 7) return "rgb(239 68 68)"; // red-500
    if (days >= 3) return "rgb(249 115 22)"; // orange-500
    return "rgb(234 179 8)"; // yellow-500
  };

  const handleRecordPayment = (studentId: number) => {
    // This will open a payment recording modal when backend is connected
    console.log("Record payment for student:", studentId);
  };

  const totalAmountDue = filteredStudents.reduce((sum, student) => sum + student.amountDue, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fees Due</h1>
          <p className="text-muted-foreground">
            Students with pending fee payments (sorted by urgency)
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Amount Due</p>
          <p className="text-2xl font-bold text-destructive">
            ₹{totalAmountDue.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card bg-gradient-card border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical (7+ days)</p>
                <p className="text-2xl font-bold text-destructive">
                  {filteredStudents.filter(s => s.daysOverdue >= 7).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-gradient-card border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High (3-6 days)</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredStudents.filter(s => s.daysOverdue >= 3 && s.daysOverdue < 7).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-gradient-card border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Medium (1-2 days)</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredStudents.filter(s => s.daysOverdue >= 1 && s.daysOverdue < 3).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredStudents.length}
                </p>
              </div>
              <User className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card className="shadow-card bg-gradient-card">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or enrollment number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send All Reminders
              </Button>
              <Button>
                <DollarSign className="w-4 h-4 mr-2" />
                Bulk Payment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <div className="space-y-4">
        {filteredStudents.map((student, index) => (
          <Card 
            key={student.id} 
            className="shadow-card hover:shadow-hover transition-all duration-200 bg-gradient-card"
            style={{ borderLeft: `4px solid ${getUrgencyColor(student.daysOverdue)}` }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {/* Priority Number */}
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                </div>

                {/* Student Photo */}
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-muted-foreground font-medium">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>

                {/* Student Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-foreground">{student.name}</h3>
                    {getDaysOverdueBadge(student.daysOverdue)}
                  </div>
                  
                  <div className="grid gap-2 md:grid-cols-3 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Enrollment:</span> {student.enrollmentNumber}
                    </div>
                    <div>
                      <span className="font-medium">Branch:</span> {student.branch}
                    </div>
                    <div>
                      <span className="font-medium">Due Date:</span> {new Date(student.dueDate).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Amount and Actions */}
                <div className="text-right space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Due</p>
                    <p className="text-xl font-bold text-destructive">
                      ₹{student.amountDue.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`tel:${student.phone}`)}
                      title="Call Student"
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => 
                        window.open(
                          `https://wa.me/${student.phone.replace(/[^0-9]/g, '')}?text=Hi ${student.name}, your mess fee of ₹${student.amountDue} is overdue by ${student.daysOverdue} days. Please pay at your earliest convenience. Thank you!`
                        )
                      }
                      title="Send WhatsApp Message"
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRecordPayment(student.id)}
                    >
                      <DollarSign className="w-3 h-3 mr-1" />
                      Record Payment
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Last reminder: {new Date(student.lastReminder).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Urgency Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Urgency Level</span>
                  <span>{student.daysOverdue} days overdue</span>
                </div>
                <Progress 
                  value={Math.min((student.daysOverdue / 10) * 100, 100)} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card className="shadow-card bg-gradient-card">
          <CardContent className="py-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No pending fees</h3>
            <p className="text-muted-foreground">
              Great! No students have overdue fees at the moment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeesDue;