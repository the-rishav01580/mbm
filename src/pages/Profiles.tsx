import { useState } from "react";
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
  Calendar
} from "lucide-react";
import { StudentProfileModal } from "@/components/students/StudentProfileModal";
import { toast } from "sonner";
import { calculateDueDate, getDaysUntilDue, getFeeStatus } from "@/lib/dateUtils";

const Profiles = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Mock student data - will be replaced with Supabase data
  const initialStudents = [
    {
      id: 1,
      name: "Rajesh Kumar",
      enrollmentNumber: "20CS001",
      branch: "Computer Science",
      phone: "+91 9876543210",
      fatherPhone: "+91 9876543211",
      registrationDate: "2024-01-15",
      feesStatus: "paid",
      photo: null,
      lastPayment: "2024-01-15",
      totalPaid: 7500,
    },
    {
      id: 2,
      name: "Priya Sharma",
      enrollmentNumber: "20EC002",
      branch: "Electronics",
      phone: "+91 9876543212",
      fatherPhone: "+91 9876543213",
      registrationDate: "2024-01-16",
      feesStatus: "pending",
      photo: null,
      lastPayment: "2023-12-15",
      totalPaid: 5000,
    },
    {
      id: 3,
      name: "Amit Singh",
      enrollmentNumber: "20ME003",
      branch: "Mechanical",
      phone: "+91 9876543214",
      fatherPhone: "+91 9876543215",
      registrationDate: "2024-01-17",
      feesStatus: "overdue",
      photo: null,
      lastPayment: "2023-11-15",
      totalPaid: 2500,
    },
    {
      id: 4,
      name: "Sneha Patel",
      enrollmentNumber: "20IT004",
      branch: "Information Technology",
      phone: "+91 9876543216",
      fatherPhone: "+91 9876543217",
      registrationDate: "2024-01-18",
      feesStatus: "paid",
      photo: null,
      lastPayment: "2024-01-18",
      totalPaid: 10000,
    },
    {
      id: 5,
      name: "Vikash Jha",
      enrollmentNumber: "20CE005",
      branch: "Civil Engineering",
      phone: "+91 9876543218",
      fatherPhone: "+91 9876543219",
      registrationDate: "2024-01-19",
      feesStatus: "pending",
      photo: null,
      lastPayment: "2023-12-20",
      totalPaid: 3750,
    },
    {
      id: 6,
      name: "Ananya Das",
      enrollmentNumber: "20EE006",
      branch: "Electrical Engineering",
      phone: "+91 9876543220",
      fatherPhone: "+91 9876543221",
      registrationDate: "2024-01-20",
      feesStatus: "paid",
      photo: null,
      lastPayment: "2024-01-20",
      totalPaid: 8750,
    },
  ];

  const [studentsList, setStudentsList] = useState(initialStudents);
  const branches = ["Computer Science", "Electronics", "Mechanical", "Information Technology", "Civil Engineering", "Electrical Engineering"];

  const filteredStudents = studentsList.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = !selectedBranch || selectedBranch === "all" || student.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-success text-success-foreground">Paid</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Pending</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewProfile = (student: any) => {
    // Calculate due date and days until due based on registration date
    const dueDate = calculateDueDate(student.registrationDate);
    const daysUntilDue = getDaysUntilDue(dueDate);
    
    // Transform student data to match modal format
    const modalStudent = {
      ...student,
      id: student.id.toString(), // Convert number to string
      fatherName: "N/A", // Add this field to your mock data if needed
      daysUntilDue,
      dueDate,
      feesAmount: 2500,
      lastPaymentDate: student.lastPayment,
      photo: student.photo || "", // Ensure photo is not null
      transactions: [
        {
          id: "1",
          date: student.lastPayment,
          amount: student.totalPaid,
          type: "cash" as const,
          status: "completed" as const
        }
      ]
    };
    setSelectedStudent(modalStudent);
    setIsProfileModalOpen(true);
  };

  const handleEditStudent = (editedStudent: any) => {
    setStudentsList(prev => 
      prev.map(student => 
        student.id.toString() === editedStudent.id ? { 
          ...student, 
          ...editedStudent,
          id: parseInt(editedStudent.id), // Convert back to number for consistency
          // Update fee status based on due date if needed
          feesStatus: editedStudent.daysUntilDue < 0 ? "overdue" : 
                     editedStudent.daysUntilDue <= 7 ? "pending" : student.feesStatus
        } : student
      )
    );
    toast.success("Student profile updated successfully!");
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudentsList(prev => prev.filter(student => student.id.toString() !== studentId));
  };

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
        <Button>
          <Users className="w-4 h-4 mr-2" />
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
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-sm sm:text-base">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg font-semibold truncate">
                      {student.name}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {student.enrollmentNumber}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(student.feesStatus)}
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
                    {new Date(student.registrationDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span className="font-semibold text-foreground">₹{student.totalPaid.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-9 text-xs sm:text-sm"
                    onClick={() => handleViewProfile(student)}
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
              No students match your current search criteria.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedBranch("");
              }}
            >
              Clear filters
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
    </div>
  );
};

export default Profiles;