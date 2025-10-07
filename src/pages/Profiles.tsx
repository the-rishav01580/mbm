import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Filter, Users, Phone, MessageSquare, Eye, GraduationCap, Calendar, Loader2, Plus
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
// FIX: Aapke dateUtils se functions import kiye ja rahe hain
import { calculateDueDate, getDaysUntilDue } from "@/lib/dateUtils";

// FIX: TypeScript interface for better code quality and consistency
interface Student {
  id: string;
  enrollment_number: string;
  name: string;
  phone: string;
  father_name: string;
  father_phone: string;
  branch: string;
  registration_date: string;
  photo_url?: string;
  status: 'active' | 'fees_due' | 'inactive' | 'graduated';
  fees_paid: number;
  fees_due: number;
  created_at: string;
  updated_at: string;
}

const Profiles = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const branches = ["Computer Science", "Electronics", "Mechanical", "Civil", "Electrical"];

  // FIX: Real-time subscription ke liye fetch function ko alag kiya gaya hai
  const fetchStudents = async () => {
    // setLoading ko yahan se hata diya, taaki real-time updates background me hon
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to fetch students: " + error.message);
      setStudentsList([]); // Error hone par list ko khaali kar dein
    } else {
      setStudentsList(data || []);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStudents().finally(() => setLoading(false));

    // FIX: Real-time subscription add kiya gaya hai
    const channel = supabase
      .channel('students-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        (payload) => {
          console.log('Student data changed, refreshing list...', payload);
          fetchStudents(); // Koi bhi change hone par list ko refresh karein
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredStudents = useMemo(() => {
    return studentsList.filter(student => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = student.name.toLowerCase().includes(term) ||
                           student.enrollment_number.toLowerCase().includes(term);
      const matchesBranch = !selectedBranch || selectedBranch === "all" || student.branch === selectedBranch;
      return matchesSearch && matchesBranch;
    });
  }, [studentsList, searchTerm, selectedBranch]);


  const getStatusBadge = (status: Student['status']) => {
    switch (status) {
      case "active": return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">Active</Badge>;
      case "fees_due": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">Fees Due</Badge>;
      case "inactive": return <Badge variant="destructive">Inactive</Badge>;
      case "graduated": return <Badge variant="outline">Graduated</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // FIX: Aapke dateUtils ka istemal karke 'days left' calculate kiya ja raha hai
  const getDaysToDue = (registrationDate: string): number => {
    try {
      const dueDateStr = calculateDueDate(registrationDate);
      return getDaysUntilDue(dueDateStr);
    } catch {
      return 0;
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading student profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Profiles</h1>
          <p className="text-muted-foreground">Manage and view all registered students</p>
        </div>
        <Button onClick={() => navigate('/registration')}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Student
        </Button>
      </div>

      <Card className="shadow-card bg-gradient-card">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name or enrollment number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11 text-base"/>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-full sm:w-48 h-11">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => <SelectItem key={branch} value={branch}>{branch}</SelectItem>)}
                </SelectContent>
              </Select>
              {(searchTerm || (selectedBranch && selectedBranch !== "all")) && (
                <Button variant="outline" className="h-11" onClick={() => { setSearchTerm(""); setSelectedBranch("all"); }}>Clear</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">Showing {filteredStudents.length} of {studentsList.length} students</p>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="shadow-card hover:shadow-hover transition-all duration-200 bg-gradient-card flex flex-col">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-primary cursor-zoom-in" onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(student.photo_url || ""); setIsPreviewOpen(true); }}>
                    {student.photo_url ? <img src={student.photo_url} alt={student.name} className="w-full h-full rounded-full object-cover" /> : <span className="text-white font-medium text-base">{student.name.split(' ').map(n => n[0]).join('')}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">{student.name}</CardTitle>
                    <CardDescription className="text-sm">{student.enrollment_number}</CardDescription>
                  </div>
                </div>
                <div className="flex-shrink-0">{getStatusBadge(student.status)}</div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4 flex-grow flex flex-col justify-between">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">Branch:</span><span className="font-medium truncate">{student.branch}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">Phone:</span><span className="font-medium">{student.phone}</span></div>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">Joined:</span><span className="font-medium">{new Date(student.registration_date).toLocaleDateString('en-IN')}</span></div>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-muted-foreground">Next Due:</span>
                  {(() => { const daysLeft = getDaysToDue(student.registration_date); return (<span className={daysLeft < 0 ? "font-semibold text-destructive" : "font-semibold text-foreground"}>{daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}</span>); })()}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-9" onClick={() => navigate(`/students/${student.id}`)}><Eye className="w-4 h-4 mr-2" />View Profile</Button>
                  <Button size="sm" variant="outline" className="h-9 px-3" onClick={() => window.open(`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`)}><MessageSquare className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && filteredStudents.length === 0 && (
        <Card className="shadow-card bg-gradient-card">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Students Found</h3>
            <p className="text-muted-foreground mb-4">{studentsList.length === 0 ? "No students have been registered yet." : "No students match your current search criteria."}</p>
            <Button onClick={() => { studentsList.length === 0 ? navigate('/registration') : (() => { setSearchTerm(""); setSelectedBranch("all"); })(); }}>{studentsList.length === 0 ? "Register First Student" : "Clear Filters"}</Button>
          </CardContent>
        </Card>
      )}
      
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 sm:p-4">
          {previewImageUrl && <img src={previewImageUrl} alt="Student" className="max-w-full max-h-[80vh] rounded-md" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profiles;