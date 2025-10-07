import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, Phone, MessageSquare, DollarSign, AlertTriangle, Calendar, User, Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
// FIX: Aapke dateUtils se functions import kiye ja rahe hain
import { calculateDueDate, getDaysUntilDue } from "@/lib/dateUtils"; 
import { toast } from "sonner";

// TypeScript interface for clarity and type safety
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

const FeesDue = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [studentsDue, setStudentsDue] = useState<StudentDue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAndMapData = (data: any[]): StudentDue[] => {
      return (data || []).map((s) => {
        const dueDateStr = calculateDueDate(s.registration_date);
        // FIX: Aapke getDaysUntilDue function ka istemal
        const daysLeft = getDaysUntilDue(dueDateStr); 
        // Convert negative days left into positive days overdue
        const daysOverdue = Math.max(0, -daysLeft); 
        
        return {
          id: s.id,
          name: s.name,
          enrollmentNumber: s.enrollment_number || 'N/A',
          branch: s.branch || 'N/A',
          phone: s.phone || 'N/A',
          amountDue: Number(s.fees_due) || 0,
          dueDate: dueDateStr,
          daysOverdue,
          lastReminder: s.updated_at || s.created_at,
          photo: s.photo_url || null,
        };
      });
    };

    const fetchFeesDue = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .gt('fees_due', 0);

      if (error) {
        toast.error('Failed to load fees due data: ' + error.message);
        setStudentsDue([]);
      } else {
        setStudentsDue(fetchAndMapData(data));
      }
      setLoading(false);
    };

    fetchFeesDue();

    // FIX: Real-time subscription add kiya gaya hai
    const channel = supabase
      .channel('students-fees-due')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        (payload) => {
          console.log('Change received!', payload);
          // Data ko dobara fetch karke UI ko live update karein
          fetchFeesDue();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sortedStudents = useMemo(() => {
    return [...studentsDue].sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [studentsDue]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return sortedStudents;
    const term = searchTerm.toLowerCase();
    return sortedStudents.filter(student =>
      student.name.toLowerCase().includes(term) ||
      student.enrollmentNumber.toLowerCase().includes(term)
    );
  }, [sortedStudents, searchTerm]);
  
  // ... Baaki ka JSX aur helper functions bilkul a se z tak aane wala rahenge ...
  // ... Unme koi badlav ki zaroorat nahi hai ...

  const getDaysOverdueBadge = (days: number) => {
    if (days >= 7) return <Badge variant="destructive">Critical ({days}d overdue)</Badge>;
    if (days >= 3) return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">High ({days}d overdue)</Badge>;
    if (days > 0) return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Medium ({days}d overdue)</Badge>;
    return <Badge variant="secondary">Due Soon</Badge>;
  };

  const getUrgencyColor = (days: number) => {
    if (days >= 7) return "rgb(239 68 68)";
    if (days >= 3) return "rgb(249 115 22)";
    if (days > 0) return "rgb(234 179 8)";
    return "rgb(100 116 139)";
  };

  const handleRecordPayment = (studentId: string) => {
    navigate(`/students/${studentId}`);
  };

  const totalAmountDue = useMemo(() => {
    return filteredStudents.reduce((sum, student) => sum + student.amountDue, 0);
  }, [filteredStudents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fees Due</h1>
          <p className="text-muted-foreground">Students with pending payments (sorted by urgency)</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Amount Due</p>
          <p className="text-2xl font-bold text-destructive">₹{totalAmountDue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <Card className="shadow-card bg-gradient-card">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name or enrollment number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => toast.info("Feature coming soon!")}><MessageSquare className="w-4 h-4 mr-2" /> Send All Reminders</Button>
              <Button onClick={() => toast.info("Feature coming soon!")}><DollarSign className="w-4 h-4 mr-2" /> Bulk Payment</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading && <div className="flex items-center justify-center py-12 text-muted-foreground">Loading due fees data...</div>}
        {!loading && filteredStudents.map((student, index) => (
          <Card key={student.id} className="shadow-card hover:shadow-hover transition-all duration-200 bg-gradient-card" style={{ borderLeft: `4px solid ${getUrgencyColor(student.daysOverdue)}` }}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center"><span className="text-white text-sm font-bold">{index + 1}</span></div>
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                  {student.photo ? <img src={student.photo} alt={student.name} className="w-full h-full object-cover" /> : <span className="text-muted-foreground font-medium">{student.name.split(' ').map(n => n[0]).join('')}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-foreground">{student.name}</h3>
                    {getDaysOverdueBadge(student.daysOverdue)}
                  </div>
                  <div className="grid gap-x-4 gap-y-1 md:grid-cols-3 text-sm text-muted-foreground">
                    <div><span className="font-medium text-foreground/80">Enrollment:</span> {student.enrollmentNumber}</div>
                    <div><span className="font-medium text-foreground/80">Branch:</span> {student.branch}</div>
                    <div><span className="font-medium text-foreground/80">Due Date:</span> {new Date(student.dueDate).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
                <div className="text-right space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Due</p>
                    <p className="text-xl font-bold text-destructive">₹{student.amountDue.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => window.open(`tel:${student.phone}`)} title="Call Student"><Phone className="w-3 h-3 mr-1" /> Call</Button>
                    <Button size="sm" variant="outline" onClick={() => window.open(`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}?text=Hi ${student.name}, your mess fee of ₹${student.amountDue} is overdue.`)} title="Send WhatsApp"><MessageSquare className="w-3 h-3 mr-1" /> WhatsApp</Button>
                    <Button size="sm" onClick={() => handleRecordPayment(student.id)}><DollarSign className="w-3 h-3 mr-1" /> Pay</Button>
                  </div>
                </div>
              </div>
              <div className="mt-4 pl-[64px]">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Urgency Level</span>
                  <span>{student.daysOverdue} days overdue</span>
                </div>
                <Progress value={Math.min((student.daysOverdue / 10) * 100, 100)} className="h-2" />
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
            <p className="text-muted-foreground">No students have overdue fees at the moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeesDue;