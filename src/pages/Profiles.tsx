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
  shift?: MealShift;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  student_id: string;
  amount: number;
  status: 'completed' | 'pending';
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
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Helper function to get WhatsApp URL (matching feedue.tsx pattern)
const getWhatsAppUrl = (student: Student, pendingAmount: number, daysOverdue: number): string => {
  let phoneNumber = student.phone.replace(/[^0-9]/g, '');
  // Add country code if not present (assuming India)
  if (phoneNumber.length === 10) {
    phoneNumber = '91' + phoneNumber;
  }
  
  let message: string;
  if (pendingAmount > 0) {
    const amountDue = formatCurrency(pendingAmount);
    if (daysOverdue > 0) {
      message = `Hi ${student.name}, this is a friendly reminder from the MAA BHAGVATI MESS. Your fee of ${amountDue} is overdue by ${daysOverdue} days. Please pay at your earliest convenience to avoid any inconvenience. Thank you!`;
    } else {
      message = `Hi ${student.name}, this is a friendly reminder from the MAA BHAGVATI MESS. Your fee of ${amountDue} is due. Please pay at your earliest convenience. Thank you!`;
    }
  } else {
    message = `Hi ${student.name}, this is a friendly reminder from the MAA BHAGVATI MESS. Your monthly mess fee is due. Please pay at your earliest convenience. Thank you!`;
  }
  
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
};

const Profiles = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedShift, setSelectedShift] = useState("all");
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const branches = ["Computer Science", "Electronics", "Mechanical", "Civil", "Electrical", "Information Technology"];
  
  const shiftOptions = [
    { value: "all", label: "All Shifts" },
    { value: "lunch", label: "Lunch Only" },
    { value: "dinner", label: "Dinner Only" },
    { value: "both", label: "Both" }
  ];

  // Fetch students and transactions
  const fetchData = useCallback(async () => {
    try {
      const [studentsRes, transactionsRes] = await Promise.all([
        supabase.from('students').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*')
      ]);

      if (studentsRes.error) {
        console.error("Database error:", studentsRes.error);
        toast.error("Failed to fetch students");
        setStudentsList([]);
      } else {
        setStudentsList(studentsRes.data || []);
      }

      if (transactionsRes.error && transactionsRes.error.code !== 'PGRST116') {
        console.error("Transactions error:", transactionsRes.error);
      } else {
        setTransactions(transactionsRes.data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred");
      setStudentsList([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData();

    const channel = supabase
      .channel('students-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Calculate pending amounts for each student
  const studentPendingAmounts = useMemo(() => {
    const pendingMap = new Map<string, number>();
    transactions.forEach(transaction => {
      if (transaction.status === 'pending') {
        const current = pendingMap.get(transaction.student_id) || 0;
        pendingMap.set(transaction.student_id, current + transaction.amount);
      }
    });
    return pendingMap;
  }, [transactions]);

  // Enhanced filtering
  const filteredStudents = useMemo(() => {
    return studentsList.filter(student => {
      const term = searchTerm.toLowerCase().trim();
      
      const matchesSearch = !term || 
        student.name.toLowerCase().includes(term) ||
        student.enrollment_number.toLowerCase().includes(term) ||
        student.phone.includes(term) ||
        student.father_phone?.includes(term);
      
      const matchesBranch = selectedBranch === "all" || student.branch === selectedBranch;
      const matchesShift = selectedShift === "all" || student.shift === selectedShift;
      
      return matchesSearch && matchesBranch && matchesShift;
    });
  }, [studentsList, searchTerm, selectedBranch, selectedShift]);

  // Handle WhatsApp click
  const handleWhatsAppClick = useCallback((e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    
    if (!student.phone || student.phone === 'N/A') {
      toast.error("Phone number not available");
      return;
    }

    try {
      const pendingAmount = studentPendingAmounts.get(student.id) || 0;
      const daysLeft = student.due_date ? getDaysUntilDue(student.due_date) : 0;
      const daysOverdue = Math.max(0, -daysLeft);
      
      const url = getWhatsAppUrl(student, pendingAmount, daysOverdue);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error("Error opening WhatsApp:", err);
      toast.error("Failed to open WhatsApp");
    }
  }, [studentPendingAmounts]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Profiles</h1>
          <p className="text-muted-foreground">Manage and view all registered students</p>
        </div>
        <Button onClick={() => navigate('/registration')}>
          <Plus className="w-4 h-4 mr-2" /> Add New Student
        </Button>
      </div>

      <Card className="shadow-card bg-gradient-card">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, enrollment number, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
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

      <p className="text-sm text-muted-foreground">
        Showing {filteredStudents.length} of {studentsList.length} students
      </p>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredStudents.map((student) => {
          const daysLeft = student.due_date ? getDaysUntilDue(student.due_date) : null;
          const pendingAmount = studentPendingAmounts.get(student.id) || 0;
          
          return (
            <Card key={student.id} className="shadow-card hover:shadow-hover transition-all duration-200 bg-gradient-card flex flex-col">
              <CardHeader className="p-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
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
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Branch:</span>
                    <span className="font-medium truncate">{student.branch || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{student.phone || 'N/A'}</span>
                  </div>
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
                  {pendingAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount Due:</span>
                      <span className="font-semibold text-destructive">
                        {formatCurrency(pendingAmount)}
                      </span>
                    </div>
                  )}
                  
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
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Shift:</span>
                    {getShiftBadge(student.shift) || <span className="text-muted-foreground text-xs">Not Set</span>}
                  </div>
                  
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
                      disabled={!student.phone || student.phone === 'N/A'}
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