import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Users, 
  Phone, 
  MessageSquare,
  Eye,
  Edit,
  MoreVertical,
  GraduationCap,
  Calendar,
  Loader2,
  Plus
} from "lucide-react";
import { StudentProfileModal } from "@/components/students/StudentProfileModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { calculateDueDate } from "@/lib/dateUtils";

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
  status: string;
  fees_paid: number;
  fees_due: number;
  created_at: string;
  updated_at: string;
}

const Profiles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const branches = ["Computer Science", "Electronics", "Mechanical", "Civil", "Electrical"];

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setStudentsList(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch students: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = studentsList.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = !selectedBranch || selectedBranch === "all" || student.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-success text-success-foreground">Active</Badge>;
      case "fees_due":
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Fees Due</Badge>;
      case "inactive":
        return <Badge variant="destructive">Inactive</Badge>;
      case "graduated":
        return <Badge variant="outline">Graduated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewProfile = (student: Student) => {
    // Transform student data to match modal format
    const modalStudent = {
      id: student.id,
      name: student.name,
      enrollmentNumber: student.enrollment_number,
      phone: student.phone,
      fatherName: student.father_name,
      fatherPhone: student.father_phone,
      branch: student.branch,
      registrationDate: student.registration_date,
      photo: student.photo_url || "",
      status: student.status,
      feesAmount: student.fees_due,
      feesPaid: student.fees_paid,
      lastPaymentDate: student.updated_at,
      daysUntilDue: 30, // Calculate based on your business logic
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      transactions: [
        {
          id: "1",
          date: student.updated_at,
          amount: student.fees_paid,
          type: "cash" as const,
          status: "completed" as const
        }
      ]
    };
    setSelectedStudent(modalStudent);
    setIsProfileModalOpen(true);
  };

  const handleEditStudent = async (editedStudent: any) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: editedStudent.name,
          phone: editedStudent.phone,
          father_name: editedStudent.fatherName,
          father_phone: editedStudent.fatherPhone,
          branch: editedStudent.branch,
          status: editedStudent.status,
          fees_paid: editedStudent.feesPaid,
          fees_due: editedStudent.feesAmount,
        })
        .eq('id', editedStudent.id);

      if (error) {
        throw error;
      }

      toast.success("Student profile updated successfully!");
      fetchStudents(); // Refresh the list
    } catch (error: any) {
      toast.error("Failed to update student: " + error.message);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) {
        throw error;
      }

      toast.success("Student deleted successfully!");
      fetchStudents(); // Refresh the list
      setIsProfileModalOpen(false);
    } catch (error: any) {
      toast.error("Failed to delete student: " + error.message);
    }
  };

  const getDaysToDue = (registrationDate: string) => {
    try {
      const dueDateStr = calculateDueDate(registrationDate);
      const dueDate = new Date(dueDateStr);
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const msPerDay = 1000 * 60 * 60 * 24;
      return Math.ceil((dueDate.getTime() - startOfToday.getTime()) / msPerDay);
    } catch {
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Profiles</h1>
          <p className="text-muted-foreground">
            Manage and view all registered students
          </p>
        </div>
        <Button onClick={() => navigate('/registration')}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Student
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card bg-gradient-card">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or enrollment number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-full sm:w-48 h-11">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchTerm || (selectedBranch && selectedBranch !== "all")) && (
                <Button
                  variant="outline"
                  className="h-11 sm:w-auto"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedBranch("");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredStudents.length} of {studentsList.length} students
        </p>
      </div>

      {/* Students Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="shadow-card hover:shadow-hover transition-all duration-200 bg-gradient-card">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={student.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0 cursor-zoom-in"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImageUrl(student.photo_url || "");
                        setIsPreviewOpen(true);
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium text-sm sm:text-base">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg font-semibold truncate">
                      {student.name}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {student.enrollment_number}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(student.status)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Branch:</span>
                  <span className="font-medium truncate">{student.branch}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{student.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="font-medium">
                    {new Date(student.registration_date).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
                  <span className="text-muted-foreground">Fees Paid:</span>
                  <span className="font-semibold text-foreground">₹{student.fees_paid.toLocaleString('en-IN')}</span>
                </div>
                {student.fees_due > 0 && (
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
                    <span className="text-muted-foreground">Fees Due:</span>
                    <span className="font-semibold text-destructive">₹{student.fees_due.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
                  <span className="text-muted-foreground">Next Due:</span>
                  {(() => {
                    const daysLeft = getDaysToDue(student.registration_date);
                    return (
                      <span className={daysLeft < 0 ? "font-semibold text-destructive" : "font-semibold text-foreground"}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                      </span>
                    );
                  })()}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-9 text-xs sm:text-sm"
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    <span className="hidden xs:inline">View</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3"
                    onClick={() => window.open(`tel:${student.phone}`)}
                  >
                    <Phone className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3"
                    onClick={() => 
                      window.open(
                        `https://wa.me/${student.phone.replace(/[^0-9]/g, '')}?text=Hi ${student.name}, this is a message from the mess management.`
                      )
                    }
                  >
                    <MessageSquare className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card className="shadow-card bg-gradient-card">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No students found</h3>
            <p className="text-muted-foreground mb-4">
              {studentsList.length === 0 
                ? "No students have been registered yet."
                : "No students match your current search criteria."
              }
            </p>
            <Button
              onClick={() => {
                if (studentsList.length === 0) {
                  navigate('/registration');
                } else {
                  setSearchTerm("");
                  setSelectedBranch("");
                }
              }}
            >
              {studentsList.length === 0 ? "Register First Student" : "Clear filters"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Student Profile Modal */}
      <StudentProfileModal
        student={selectedStudent}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
      />

      {/* Image Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 sm:p-4">
          {previewImageUrl && (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={previewImageUrl}
                alt="Student"
                className="max-w-full max-h-[80vh] rounded-md"
                onClick={() => setIsPreviewOpen(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profiles;