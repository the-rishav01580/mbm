// src/components/student-profile/EditStudentDialog.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Student } from "./types"; // Assuming your types are in this file

interface EditStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSave: (updatedStudent: Partial<Student>) => void;
}

export const EditStudentDialog = ({ isOpen, onClose, student, onSave }: EditStudentDialogProps) => {
  const [formData, setFormData] = useState<Partial<Student>>({});

  useEffect(() => {
    if (student) {
      setFormData(student);
    }
  }, [student]);

  const handleChange = (field: keyof Student, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = () => {
    onSave(formData);
    onClose();
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Student Details</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2"><Label>Full Name</Label><Input value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} /></div>
          <div className="space-y-2"><Label>Father's Name</Label><Input value={formData.father_name || ''} onChange={e => handleChange('father_name', e.target.value)} /></div>
          <div className="space-y-2"><Label>Branch</Label><Input value={formData.branch || ''} onChange={e => handleChange('branch', e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};