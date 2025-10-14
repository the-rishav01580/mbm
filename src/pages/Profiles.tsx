import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Filter, Users, Phone, MessageSquare, Eye, GraduationCap, Calendar, Loader2, Plus, Utensils
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { getDaysUntilDue } from "@/lib/dateUtils";

// Type definitions
type MealShift = "lunch" | "dinner" | "both";
type StudentStatus = 'active' | 'fees_due' | 'inactive' | 'graduated';

interface Student {
  id: string;
  enrollment_number: string;
  name: string;
  phone: string;
  father_name: string;
  father_phone: string;
  branch: string;
  registration_date: string;
  due_date: string;
  photo_url?: string;
  status: StudentStatus;
  fees_paid: number;
  fees_due: number;
  shift?: MealShift; // Added shift field
  created_at: string;
  updated_at: string;
}

// Helper function to get shift badge with colors
const getShiftBadge = (shift?: MealShift): JSX.Element | null => {
  if (!shift) return null;
  
  const shiftConfig = {
    lunch: { label: "Lunch", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    dinner: { label: "Dinner", color: "bg-blue-100 text-blue-700 border-blue-200" },
    both: { label: "Both", color: "bg-purple-100 text-purple-700 border-purple-200" }
  };
  
  const config = shiftConfig[shift];
  return (
    <Badge variant="outline" className={`${config.color} text-xs`}>
      <Utensils className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

// Helper function to get status badge
const getStatusBadge = (status: StudentStatus): JSX.Element => {
  const statusConfig = {
    active: { variant: "default" as const, className: "bg-green-100 text-green-700 border-green-200" },
    fees_due: { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    inactive: { variant: "destructive" as const, className: "" },
    graduated: { variant: "outline" as const, className: "" }
  };

  const config = statusConfig[status] || statusConfig.inactive;
  return (
    <Badge variant={config.variant} className={config.className}>
      {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </Badge>
  );
};

// Currency formatter
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", { 
    style: "currency", 
    currency: "INR", 
    maximumFractionDigits: 0 
  }).format(amount);
};

const Profiles = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedShift, setSelectedShift] = useState("all"); // Added shift filter
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const branches = ["Computer Science", "Electronics", "Mechanical", "Civil", "Electrical", "Information Technology"];
  
  // Shift options for filter
  const shiftOptions = [
    { value: "all", label: "All Shifts" },
    { value: "lunch", label: "Lunch Only" },
    { value: "dinner", label: "Dinner Only" },
    { value: "both", label: "Both" }
  ];

  // Fetch students with error handling
  const fetchStudents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Database error:", error);
        toast.error("Failed to fetch students: " + error.message);
        setStudentsList([]);
      } else {
        setStudentsList(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred while fetching students");
      setStudentsList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchStudents();

    // Real-time subscription with error handling
    const channel = supabase
      .channel('students-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        (payload) => {
          console.log('Student list changed:', payload);
          fetchStudents();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStudents]);

  // Enhanced filtering with phone number and shift search
  const filteredStudents = useMemo(() => {
    return studentsList.filter(student => {
      const term = searchTerm.toLowerCase().trim();
      
      // Search by name, enrollment number, or phone number
      const matchesSearch = !term || 
        student.name.toLowerCase().includes(term) ||
        student.enrollment_number.toLowerCase().includes(term) ||
        student.phone.includes(term) ||
        student.father_phone?.includes(term);
      
      // Filter by branch
      const matchesBranch = selectedBranch === "all" || student.branch === selectedBranch;
      
      // Filter by shift
      const matchesShift = selectedShift === "all" || student.shift === selectedShift;
      
      return matchesSearch && matchesBranch && matchesShift;
    });
  }, [studentsList, searchTerm, selectedBranch, selectedShift]);

  // Generate WhatsApp URL with error handling
  const generateWhatsAppUrl = useCallback((student: Student): string => {
    try {
      let phoneNumber = student.phone.replace(/[^0-9]/g, '');
      if (phoneNumber.length === 10) phoneNumber = '91' + phoneNumber;

      let message: string;
      if (student.fees_due > 0) {
        const amountDue = formatCurrency(student.fees_due);
        message = `Hi ${student.name}, this is a friendly reminder from the mess management. Your fee of ${amountDue} is pending. Please pay at your earliest convenience. Thank you!`;
      } else {
        message = `Hi ${student.name}, this is a message from the MAA BHAGVATI MESS.`;
      }
      
      return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    } catch (err) {
      console.error("Error generating WhatsApp URL:", err);
      return '#';
    }
  }, []);

  // Handle WhatsApp click with error handling
  const handleWhatsAppClick = useCallback((e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    try {
      const url = generateWhatsAppUrl(student);
      if (url !== '#') {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error("Unable to open WhatsApp");
      }
    } catch (err) {
      console.error("Error opening WhatsApp:", err);
      toast.error("Failed to open WhatsApp");
    }
  }, [generateWhatsAppUrl]);

  // Handle image preview
  const handleImagePreview = useCallback((e: React.MouseEvent, photoUrl?: string) => {
    e.stopPropagation();
    if (photoUrl) {
      setPreviewImageUrl(photoUrl);
      setIsPreviewOpen(true);
    }
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedBranch("all");
    setSelectedShift("all");
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading Students...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Profiles</h1>
          <p className="text-muted-foreground">Manage and view all registered students</p>
        </div>
        <Button onClick={() => navigate('/registration')}>
          <Plus className="w-4 h-4 mr-2" /> Add New Student
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-card bg-gradient-card">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, enrollment number, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Branch Filter */}
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-full sm:w-48 h-11">
                  <GraduationCap className="w-4 h-4 mr-2" />
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

              {/* Shift Filter */}
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger className="w-full sm:w-48 h-11">
                  <Utensils className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by shift" />
                </SelectTrigger>
                <SelectContent>
                  {shiftOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              {(searchTerm || selectedBranch !== "all" || selectedShift !== "all") && (
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={clearFilters}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredStudents.length} of {studentsList.length} students
      </p>

      {/* Student Cards Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredStudents.map((student) => {
          const daysLeft = student.due_date ? getDaysUntilDue(student.due_date) : null;
          
          return (
            <Card 
              key={student.id} 
              className="shadow-card hover:shadow-hover transition-all duration-200 bg-gradient-card flex flex-col"
            >
              <CardHeader className="p-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Profile Picture */}
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-primary cursor-zoom-in" 
                      onClick={(e) => handleImagePreview(e, student.photo_url)}
                    >
                      {student.photo_url ? (
                        <img 
                          src={student.photo_url} 
                          alt={student.name} 
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = `<span class="text-white font-medium text-base">${student.name.split(' ').map(n => n[0]).join('')}</span>`;
                          }}
                        />
                      ) : (
                        <span className="text-white font-medium text-base">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      )}
                    </div>
                    {/* Name and Enrollment */}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate">{student.name}</CardTitle>
                      <CardDescription className="text-sm">{student.enrollment_number}</CardDescription>
                    </div>
                  </div>
                  {/* Status Badge */}
                  <div className="flex-shrink-0">{getStatusBadge(student.status)}</div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 pt-0 space-y-4 flex-grow flex flex-col justify-between">
                <div className="space-y-2 text-sm">
                  {/* Branch */}
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Branch:</span>
                    <span className="font-medium truncate">{student.branch || 'N/A'}</span>
                  </div>
                  {/* Phone */}
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{student.phone || 'N/A'}</span>
                  </div>
                  {/* Joined Date */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="font-medium">
                      {student.registration_date 
                        ? new Date(student.registration_date).toLocaleDateString('en-IN')
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t space-y-2">
                  {/* Amount Due */}
                  {student.fees_due > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount Due:</span>
                      <span className="font-semibold text-destructive">
                        {formatCurrency(student.fees_due)}
                      </span>
                    </div>
                  )}
                  
                  {/* Next Due */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Next Due:</span>
                    {daysLeft !== null ? (
                      <span className={daysLeft < 0 ? "font-semibold text-destructive" : "font-semibold text-foreground"}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not Set</span>
                    )}
                  </div>
                  
                  {/* Shift Badge */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Shift:</span>
                    {getShiftBadge(student.shift) || <span className="text-muted-foreground text-xs">Not Set</span>}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 h-9" 
                      onClick={() => navigate(`/students/${student.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-9 px-3" 
                      onClick={(e) => handleWhatsAppClick(e, student)}
                      title="Send WhatsApp Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && filteredStudents.length === 0 && (
        <Card className="shadow-card bg-gradient-card">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No students found</h3>
            <p className="text-muted-foreground mb-4">
              {studentsList.length === 0 
                ? "No students have been registered yet." 
                : "No students match your current search criteria."}
            </p>
            <Button 
              onClick={() => {
                if (studentsList.length === 0) {
                  navigate('/registration');
                } else {
                  clearFilters();
                }
              }}
            >
              {studentsList.length === 0 ? "Register First Student" : "Clear Filters"}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Image Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 sm:p-4">
          {previewImageUrl && (
            <img 
              src={previewImageUrl} 
              alt="Student" 
              className="max-w-full max-h-[80vh] rounded-md object-contain"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=Student&background=random`;
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profiles;