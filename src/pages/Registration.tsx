import { useState, useEffect } from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, addMonths } from "date-fns";
import { 
  CalendarIcon, Camera, Upload, User, Phone, GraduationCap, Save, X, Loader2, AlertCircle, ChevronsUpDown, Utensils
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { validateFile, sanitizeInput } from "@/lib/validation";

const Registration = () => {
  const { user } = useAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [registrationDate, setRegistrationDate] = useState<Date>();
  const [dueDate, setDueDate] = useState<Date>();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ 
    fullName: "", 
    phone: "", 
    fatherName: "", 
    fatherPhone: "", 
    branch: "", 
    enrollmentNumber: "",
    shift: ""
  });
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const branches = ["Computer Science", "Electronics & Comm.", "Mechanical", "Civil", "Electrical", "Information Technology"];
  
  const shiftOptions = [
    { value: "lunch", label: "Lunch Only" },
    { value: "dinner", label: "Dinner Only" },
    { value: "both", label: "Both (Lunch & Dinner)" }
  ];

  useEffect(() => {
    if (registrationDate) {
      setDueDate(addMonths(registrationDate, 1));
    }
  }, [registrationDate]);

  const handleInputChange = (field: string, value: string) => {
    const fieldType = (field === 'fullName' || field === 'fatherName') ? 'name' : 'default';
    const sanitizedValue = fieldType === 'name' ? value : sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) { 
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" }); 
      return; 
    }

    // Minimal validation - only check if at least name or enrollment number is provided
    if (!formData.fullName && !formData.enrollmentNumber) {
      toast({ 
        title: "Validation Error", 
        description: "Please provide at least student name or enrollment number.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${formData.enrollmentNumber || 'student'}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('student-photos').upload(fileName, photoFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('student-photos').getPublicUrl(fileName);
        const { data } = supabase.storage.from('student-photos').getPublicUrl(fileName);
        photoUrl = data.publicUrl;
      }

      // Build the insert object with only provided fields
      const insertData: any = {
        created_by: user.id,
      };

      // Add fields only if they have values
      if (formData.enrollmentNumber) insertData.enrollment_number = formData.enrollmentNumber;
      if (formData.fullName) insertData.name = formData.fullName.trim();
      if (formData.phone) insertData.phone = formData.phone;
      if (formData.fatherName) insertData.father_name = formData.fatherName.trim();
      if (formData.fatherPhone) insertData.father_phone = formData.fatherPhone;
      if (formData.branch) insertData.branch = formData.branch;
      if (formData.shift) insertData.shift = formData.shift;
      if (registrationDate) insertData.registration_date = registrationDate.toISOString().split('T')[0];
      if (dueDate) insertData.due_date = dueDate.toISOString().split('T')[0];
      if (photoUrl) insertData.photo_url = photoUrl;

      const { error: insertError } = await supabase.from('students').insert(insertData);

      if (insertError) throw insertError;
      
      toast({ 
        title: "Success", 
        description: "Student registered successfully!" 
      });
      
      handleClearForm();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to register student.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearForm = () => {
    setFormData({ 
      fullName: "", 
      phone: "", 
      fatherName: "", 
      fatherPhone: "", 
      branch: "", 
      enrollmentNumber: "", 
      shift: "" 
    });
    setRegistrationDate(undefined);
    setDueDate(undefined);
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 pb-8 sm:px-0">
    <div className="max-w-4xl mx-auto space-y-6 px-4 pb-8 sm:px-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Student Registration</h1>
        <p className="text-muted-foreground">Add new student details to the system (All fields are optional)</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" /> Personal Information
                </CardTitle>
                <CardDescription>Basic details of the student (Optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      placeholder="Enter student's full name" 
                      value={formData.fullName} 
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      placeholder="+91 xxxxx xxxxx" 
                      value={formData.phone} 
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name</Label>
                    <Input 
                      id="fatherName" 
                      placeholder="Enter father's full name" 
                      value={formData.fatherName} 
                      onChange={(e) => handleInputChange("fatherName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherPhone">Father's Phone Number</Label>
                    <Input 
                      id="fatherPhone" 
                      placeholder="+91 xxxxx xxxxx" 
                      value={formData.fatherPhone} 
                      onChange={(e) => handleInputChange("fatherPhone", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" /> Academic Information
                </CardTitle>
                <CardDescription>Student's academic details (Optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          role="combobox" 
                          aria-expanded={comboboxOpen} 
                          className={cn("w-full justify-between font-normal", !formData.branch && "text-muted-foreground")}
                        >
                          {formData.branch || "Select or type branch..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Search or type new branch..." 
                            onValueChange={(value) => handleInputChange("branch", value)} 
                          />
                          <CommandList>
                            <CommandEmpty>No branch found. Type to add.</CommandEmpty>
                            <CommandGroup>
                              {branches.map((branch) => (
                                <CommandItem 
                                  key={branch} 
                                  value={branch} 
                                  onSelect={(currentValue) => { 
                                    handleInputChange("branch", currentValue === formData.branch ? "" : branch); 
                                    setComboboxOpen(false); 
                                  }}
                                >
                                  {branch}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enrollmentNumber">Enrollment Number</Label>
                    <Input 
                      id="enrollmentNumber" 
                      placeholder="Enter enrollment number" 
                      value={formData.enrollmentNumber} 
                      onChange={(e) => handleInputChange("enrollmentNumber", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shift" className="flex items-center gap-2">
                    <Utensils className="w-4 h-4" />
                    Meal Shift
                  </Label>
                  <Select value={formData.shift} onValueChange={(value) => handleInputChange("shift", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal shift (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {shiftOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Registration Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={cn("w-full justify-start text-left font-normal", !registrationDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {registrationDate ? format(registrationDate, "PPP") : "Pick registration date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={registrationDate} onSelect={setRegistrationDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>First Fee Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : "Pick fee due date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6 lg:col-start-3">
            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" /> Student Photo
                </CardTitle>
                <CardDescription>Upload student's ID photo (Optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Student" className="w-full h-48 object-cover rounded-lg border" />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 w-6 h-6" 
                      onClick={() => { 
                        setPhotoPreview(null); 
                        setPhotoFile(null); 
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-4"><Camera className="w-12 h-12 mx-auto text-muted-foreground" /><div><p className="text-sm font-medium">Upload photo</p><p className="text-xs text-muted-foreground">JPG, PNG, WebP up to 5MB</p></div></div>
                )}
                <div className="grid grid-cols-1 gap-2">
                  <Button type="button" variant="outline" size="sm" className="relative">
                    <Upload className="w-4 h-4 mr-2" /> Upload
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </Button>
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
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleClearForm} 
                    disabled={isSubmitting}
                  >
                    Clear Form
                  </Button>
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
