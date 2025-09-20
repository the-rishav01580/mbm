import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Edit, Trash2, Phone, MessageCircle, Save, X, Calendar as CalendarIcon, User, Users, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { calculateDueDate, getDaysUntilDue } from "@/lib/dateUtils";

interface Student {
  id: string;
  name: string;
  phone: string;
  fatherName: string;
  fatherPhone: string;
  branch: string;
  enrollmentNumber: string;
  registrationDate: string;
  photo: string;
  feesStatus: "paid" | "pending" | "overdue";
  feesAmount: number;
  daysUntilDue: number;
  dueDate?: string;
  lastPaymentDate?: string;
  transactions: {
    id: string;
    date: string;
    amount: number;
    type: "cash" | "online";
    status: "completed" | "pending";
  }[];
}

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
}

const branches = ["Computer Science", "Electronics", "Mechanical", "Civil", "Electrical"];

export function StudentProfileModal({ student, isOpen, onClose, onEdit, onDelete }: StudentProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);

  React.useEffect(() => {
    if (student) {
      setEditedStudent({ ...student });
    }
  }, [student]);

  if (!student || !editedStudent) return null;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedStudent) {
      // Recalculate due date and days until due when saving
      const dueDate = calculateDueDate(editedStudent.registrationDate);
      const daysUntilDue = getDaysUntilDue(dueDate);
      
      const updatedStudent = {
        ...editedStudent,
        dueDate,
        daysUntilDue,
      };
      
      onEdit(updatedStudent);
      setIsEditing(false);
      toast.success("Student profile updated successfully!");
    }
  };

  const handleCancel = () => {
    setEditedStudent({ ...student });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${student.name}'s profile? This action cannot be undone.`)) {
      onDelete(student.id);
      onClose();
      toast.success("Student profile deleted successfully!");
    }
  };

  const handleCall = () => {
    window.open(`tel:${student.phone}`, '_self');
  };

  const handleWhatsApp = () => {
    const message = `Hello ${student.name}, this is a reminder about your mess fees. Please make the payment at your earliest convenience. Thank you!`;
    window.open(`https://wa.me/${student.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      overdue: "bg-red-500/10 text-red-600 border-red-500/20"
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Student Profile</span>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={student.photo} alt={student.name} />
                    <AvatarFallback className="text-lg">{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    {isEditing ? (
                      <Input
                        value={editedStudent.name}
                        onChange={(e) => setEditedStudent({ ...editedStudent, name: e.target.value })}
                        className="text-lg font-semibold"
                      />
                    ) : (
                      <h3 className="text-lg font-semibold">{student.name}</h3>
                    )}
                    <p className="text-muted-foreground">{student.enrollmentNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedStudent.phone}
                        onChange={(e) => setEditedStudent({ ...editedStudent, phone: e.target.value })}
                      />
                    ) : (
                      <p className="font-medium">{student.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label>Branch</Label>
                    {isEditing ? (
                      <Select
                        value={editedStudent.branch}
                        onValueChange={(value) => setEditedStudent({ ...editedStudent, branch: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{student.branch}</p>
                    )}
                  </div>
                  <div>
                    <Label>Father's Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedStudent.fatherName}
                        onChange={(e) => setEditedStudent({ ...editedStudent, fatherName: e.target.value })}
                      />
                    ) : (
                      <p className="font-medium">{student.fatherName}</p>
                    )}
                  </div>
                  <div>
                    <Label>Father's Phone</Label>
                    {isEditing ? (
                      <Input
                        value={editedStudent.fatherPhone}
                        onChange={(e) => setEditedStudent({ ...editedStudent, fatherPhone: e.target.value })}
                      />
                    ) : (
                      <p className="font-medium">{student.fatherPhone}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <Button onClick={handleCall} className="flex-1">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Student
                  </Button>
                  <Button onClick={handleWhatsApp} variant="outline" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {student.transactions.length > 0 ? (
                  <div className="space-y-3">
                    {student.transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">₹{transaction.amount}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()} • {transaction.type}
                          </p>
                        </div>
                        <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                          {transaction.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No payment history available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Registration Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Enrollment Number</Label>
                  {isEditing ? (
                    <Input
                      value={editedStudent.enrollmentNumber}
                      onChange={(e) => setEditedStudent({ ...editedStudent, enrollmentNumber: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium">{student.enrollmentNumber}</p>
                  )}
                </div>
                <div>
                  <Label>Registration Date</Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editedStudent.registrationDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editedStudent.registrationDate ? format(new Date(editedStudent.registrationDate), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editedStudent.registrationDate ? new Date(editedStudent.registrationDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setEditedStudent({ 
                                ...editedStudent, 
                                registrationDate: date.toISOString().split('T')[0] 
                              });
                            }
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="font-medium">{new Date(student.registrationDate).toLocaleDateString()}</p>
                  )}
                </div>
                <div>
                  <Label>Due Date</Label>
                  <p className="font-medium text-primary">
                    {student.dueDate ? new Date(student.dueDate).toLocaleDateString() : 
                     new Date(calculateDueDate(student.registrationDate)).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label>Fees Amount</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedStudent.feesAmount}
                      onChange={(e) => setEditedStudent({ ...editedStudent, feesAmount: Number(e.target.value) })}
                    />
                  ) : (
                    <p className="font-medium">₹{student.feesAmount}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fees Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge className={getStatusBadge(student.feesStatus)}>
                    {student.feesStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Amount Due</span>
                  <span className="font-semibold">₹{student.feesAmount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Days Until Due</span>
                  <span className={`font-semibold ${student.daysUntilDue <= 3 ? 'text-red-600' : student.daysUntilDue <= 7 ? 'text-amber-600' : 'text-green-600'}`}>
                    {student.daysUntilDue} days
                  </span>
                </div>
                {student.lastPaymentDate && (
                  <div className="flex items-center justify-between">
                    <span>Last Payment</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(student.lastPaymentDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}