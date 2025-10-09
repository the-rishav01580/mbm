import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { format, addMonths } from "date-fns"; // addMonths ko import karein
import { 
  CalendarIcon, Camera, Upload, User, Phone, GraduationCap, Save, X, Loader2, AlertCircle, ChevronsUpDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  validatePhone, validateName, validateEnrollmentNumber, validateFile, sanitizeInput
} from "@/lib/validation";

const Registration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // --- States for Date Pickers ---
  const [registrationDate, setRegistrationDate] = useState<Date>();
  const [dueDate, setDueDate] = useState<Date>(); // --- NEW State for Due Date

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", phone: "", fatherName: "", fatherPhone: "", branch: "", enrollmentNumber: "" });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const branches = ["Computer Science", "Electronics & Comm.", "Mechanical", "Civil", "Electrical", "Information Technology"];

  // --- Automatically set due date when registration date is selected ---
  useEffect(() => {
    if (registrationDate) {
      setDueDate(addMonths(registrationDate, 1));
    }
  }, [registrationDate]);

  const handleInputChange = (field: string, value: string) => {
    const fieldType = (field === 'fullName' || field === 'fatherName') ? 'name' : 'default';
    const sanitizedValue = fieldType === 'name' ? value : sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    if (validationErrors[field]) setValidationErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileValidation = validateFile(file);
      if (!fileValidation.isValid) {
        toast({ title: "Invalid File", description: fileValidation.error, variant: "destructive" });
        event.target.value = '';
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
      setValidationErrors(prev => ({ ...prev, photo: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const nameValidation = validateName(formData.fullName, 'Full name');
    if (!nameValidation.isValid) errors.fullName = nameValidation.error!;
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) errors.phone = phoneValidation.error!;
    const fatherNameValidation = validateName(formData.fatherName, "Father's name");
    if (!fatherNameValidation.isValid) errors.fatherName = fatherNameValidation.error!;
    const fatherPhoneValidation = validatePhone(formData.fatherPhone);
    if (!fatherPhoneValidation.isValid) errors.fatherPhone = fatherPhoneValidation.error!;
    const enrollmentValidation = validateEnrollmentNumber(formData.enrollmentNumber);
    if (!enrollmentValidation.isValid) errors.enrollmentNumber = enrollmentValidation.error!;
    if (!formData.branch) errors.branch = 'Branch is required';
    if (!registrationDate) errors.registrationDate = 'Registration date is required';
    if (!dueDate) errors.dueDate = 'Fee due date is required'; // --- NEW Validation for Due Date
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Error", description: "You must be logged in.", variant: "destructive" }); return; }
    if (!validateForm()) { toast({ title: "Validation Error", description: "Please fix the errors in the form.", variant: "destructive" }); return; }

    setIsSubmitting(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${formData.enrollmentNumber}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('student-photos').upload(fileName, photoFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('student-photos').getPublicUrl(fileName);
        photoUrl = data.publicUrl;
      }

      // --- NEW: Add due_date to the insert payload ---
      const { error: insertError } = await supabase.from('students').insert({
        enrollment_number: formData.enrollmentNumber,
        name: formData.fullName.trim(),
        phone: formData.phone,
        father_name: formData.fatherName.trim(),
        father_phone: formData.fatherPhone,
        branch: formData.branch,
        registration_date: registrationDate!.toISOString().split('T')[0],
        due_date: dueDate!.toISOString().split('T')[0], // Save the due date
        photo_url: photoUrl,
        created_by: user.id,
      });

      if (insertError) throw insertError;
      toast({ title: "Success", description: "Student registered successfully!" });
      handleClearForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to register student.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearForm = () => {
    setFormData({ fullName: "", phone: "", fatherName: "", fatherPhone: "", branch: "", enrollmentNumber: "" });
    setRegistrationDate(undefined);
    setDueDate(undefined); // --- NEW: Reset due date as well ---
    setPhotoPreview(null);
    setPhotoFile(null);
    setValidationErrors({});
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 pb-8 sm:px-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Student Registration</h1>
        <p className="text-muted-foreground">Add new student details to the system</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card bg-gradient-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Personal Information</CardTitle><CardDescription>Basic details of the student</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input id="fullName" placeholder="Enter student's full name" value={formData.fullName} onChange={(e) => handleInputChange("fullName", e.target.value)} className={validationErrors.fullName ? "border-destructive" : ""} required />
                    {validationErrors.fullName && <p className="text-sm text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" /> {validationErrors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" placeholder="+91 xxxxx xxxxx" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className={validationErrors.phone ? "border-destructive" : ""} required />
                    {validationErrors.phone && <p className="text-sm text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" /> {validationErrors.phone}</p>}
                  </div>
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                   <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name *</Label>
                    <Input id="fatherName" placeholder="Enter father's full name" value={formData.fatherName} onChange={(e) => handleInputChange("fatherName", e.target.value)} className={validationErrors.fatherName ? "border-destructive" : ""} required />
                    {validationErrors.fatherName && <p className="text-sm text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" /> {validationErrors.fatherName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherPhone">Father's Phone Number *</Label>
                    <Input id="fatherPhone" placeholder="+91 xxxxx xxxxx" value={formData.fatherPhone} onChange={(e) => handleInputChange("fatherPhone", e.target.value)} className={validationErrors.fatherPhone ? "border-destructive" : ""} required />
                    {validationErrors.fatherPhone && <p className="text-sm text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" /> {validationErrors.fatherPhone}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card bg-gradient-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Academic Information</CardTitle><CardDescription>Student's academic details</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch *</Label>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={comboboxOpen} className={cn("w-full justify-between font-normal", !formData.branch && "text-muted-foreground", validationErrors.branch && "border-destructive")}>
                          {formData.branch ? branches.find(b => b.toLowerCase() === formData.branch.toLowerCase()) || formData.branch : "Select or type branch..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search or type new branch..." onValueChange={(value) => handleInputChange("branch", value)} />
                          <CommandList>
                            <CommandEmpty>No branch found. Type to add.</CommandEmpty>
                            <CommandGroup>
                              {branches.map((branch) => (
                                <CommandItem key={branch} value={branch} onSelect={(currentValue) => { handleInputChange("branch", currentValue === formData.branch ? "" : branch); setComboboxOpen(false); }}>
                                  {branch}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {validationErrors.branch && <p className="text-sm text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" /> {validationErrors.branch}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enrollmentNumber">Enrollment Number *</Label>
                    <Input id="enrollmentNumber" placeholder="Enter enrollment number" value={formData.enrollmentNumber} onChange={(e) => handleInputChange("enrollmentNumber", e.target.value)} className={validationErrors.enrollmentNumber ? "border-destructive" : ""} required />
                    {validationErrors.enrollmentNumber && <p className="text-sm text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" /> {validationErrors.enrollmentNumber}</p>}
                  </div>
                </div>
                {/* --- NEW: Registration Date and Due Date side-by-side --- */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Registration Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !registrationDate && "text-muted-foreground", validationErrors.registrationDate && "border-destructive")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {registrationDate ? format(registrationDate, "PPP") : "Pick registration date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={registrationDate} onSelect={setRegistrationDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                    {validationErrors.registrationDate && <p className="text-sm text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" /> {validationErrors.registrationDate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>First Fee Due Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground", validationErrors.dueDate && "border-destructive")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : "Pick fee due date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                    {validationErrors.dueDate && <p className="text-sm text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" /> {validationErrors.dueDate}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6 lg:col-start-3">
            <Card className="shadow-card bg-gradient-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5" /> Student Photo</CardTitle><CardDescription>Upload student's ID photo</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {photoPreview ? (
                  <div className="relative"><img src={photoPreview} alt="Student" className="w-full h-48 object-cover rounded-lg border" /><Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 w-6 h-6" onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}><X className="w-4 h-4" /></Button></div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-4"><Camera className="w-12 h-12 mx-auto text-muted-foreground" /><div><p className="text-sm font-medium">Upload photo</p><p className="text-xs text-muted-foreground">JPG, PNG, WebP up to 5MB</p></div></div>
                )}
                <div className="grid grid-cols-1 gap-2">
                  <Button type="button" variant="outline" size="sm" className="relative"><Upload className="w-4 h-4 mr-2" /> Upload<input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" /></Button>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card bg-gradient-card">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" /> Register Student
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={handleClearForm} disabled={isSubmitting}>Clear Form</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Registration;