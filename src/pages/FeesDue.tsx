import { useEffect, useMemo, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { calculateDueDate } from "@/lib/dateUtils";

const FeesDue = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [studentsDue, setStudentsDue] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFeesDue = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .gt('fees_due', 0)
        .order('updated_at', { ascending: false });
      if (error) {
        console.error('Failed to load fees due:', error.message);
        setStudentsDue([]);
      } else {
        const mapped = (data || []).map((s) => {
          const dueDateStr = calculateDueDate(s.registration_date);
          const dueDate = new Date(dueDateStr);
          const today = new Date();
          const msPerDay = 1000 * 60 * 60 * 24;
          const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / msPerDay));
          return {
            id: s.id,
            name: s.name,
            enrollmentNumber: s.enrollment_number,
            branch: s.branch,
            phone: s.phone,
            fatherPhone: s.father_phone,
            amountDue: Number(s.fees_due) || 0,
            dueDate: dueDateStr,
            daysOverdue,
            lastReminder: s.updated_at,
            photo: s.photo_url || null,
          };
        });
        setStudentsDue(mapped);
      }
      setLoading(false);
    };
    fetchFeesDue();
  }, []);

  // Sort by days overdue (ascending - most urgent first)
  const sortedStudents = useMemo(() => {
    return [...studentsDue].sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [studentsDue]);

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
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
        )}
        {!loading && filteredStudents.map((student, index) => (
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

      {!loading && filteredStudents.length === 0 && (
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