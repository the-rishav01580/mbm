import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  Camera, 
  Upload, 
  User, 
  Phone, 
  GraduationCap,
  Save,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  validatePhone, 
  validateName, 
  validateEnrollmentNumber, 
  validateFile,
  sanitizeInput,
  formatPhone
} from "@/lib/validation";

const Registration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [registrationDate, setRegistrationDate] = useState<Date>();
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
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const branches = [
    "Computer Science",
    "Electronics",
    "Mechanical", 
    "Civil",
    "Electrical"
  ];

  const handleInputChange = (field: string, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time validation for phone numbers
    if (field === 'phone' || field === 'fatherPhone') {
      const phoneValidation = validatePhone(sanitizedValue);
      if (!phoneValidation.isValid && sanitizedValue.length > 3) {
        setValidationErrors(prev => ({ ...prev, [field]: phoneValidation.error || '' }));
      }
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileValidation = validateFile(file);
      if (!fileValidation.isValid) {
        toast({
          title: "Invalid File",
          description: fileValidation.error,
          variant: "destructive",
        });
        // Clear the file input
        event.target.value = '';
        return;
      }
      
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous validation errors
      setValidationErrors(prev => ({ ...prev, photo: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate all fields
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
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to register students",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl = null;

      // Upload photo if provided
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${formData.enrollmentNumber}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('student-photos')
          .upload(fileName, photoFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('student-photos')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // Insert student data
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          enrollment_number: formData.enrollmentNumber,
          name: formData.fullName,
          phone: formData.phone,
          father_name: formData.fatherName,
          father_phone: formData.fatherPhone,
          branch: formData.branch as any,
          registration_date: registrationDate.toISOString().split('T')[0],
          photo_url: photoUrl,
          created_by: user.id,
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Success",
        description: "Student registered successfully!",
      });

      // Clear form
      setFormData({
        fullName: "",
        phone: "",
        fatherName: "",
        fatherPhone: "",
        branch: "",
        enrollmentNumber: "",
      });
      setRegistrationDate(undefined);
      setPhotoPreview(null);
      setPhotoFile(null);
      setValidationErrors({});

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register student",
        variant: "destructive",
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
    });
    setRegistrationDate(undefined);
    setPhotoPreview(null);
    setPhotoFile(null);
    setValidationErrors({});
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Student Registration</h1>
        <p className="text-muted-foreground">
          Add new student details to the mess management system
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Basic details of the student
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter student's full name"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className={validationErrors.fullName ? "border-destructive" : ""}
                      required
                    />
                    {validationErrors.fullName && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {validationErrors.fullName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={validationErrors.phone ? "border-destructive" : ""}
                      required
                    />
                    {validationErrors.phone && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {validationErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name *</Label>
                    <Input
                      id="fatherName"
                      placeholder="Enter father's full name"
                      value={formData.fatherName}
                      onChange={(e) => handleInputChange("fatherName", e.target.value)}
                      className={validationErrors.fatherName ? "border-destructive" : ""}
                      required
                    />
                    {validationErrors.fatherName && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {validationErrors.fatherName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherPhone">Father's Phone Number *</Label>
                    <Input
                      id="fatherPhone"
                      placeholder="+91 98765 43210"
                      value={formData.fatherPhone}
                      onChange={(e) => handleInputChange("fatherPhone", e.target.value)}
                      className={validationErrors.fatherPhone ? "border-destructive" : ""}
                      required
                    />
                    {validationErrors.fatherPhone && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {validationErrors.fatherPhone}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Academic Information
                </CardTitle>
                <CardDescription>
                  Student's academic details and enrollment information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch *</Label>
                    <Select 
                      value={formData.branch} 
                      onValueChange={(value) => handleInputChange("branch", value)}
                    >
                      <SelectTrigger className={validationErrors.branch ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.branch && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {validationErrors.branch}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enrollmentNumber">Enrollment Number *</Label>
                    <Input
                      id="enrollmentNumber"
                      placeholder="e.g., 20CS001"
                      value={formData.enrollmentNumber}
                      onChange={(e) => handleInputChange("enrollmentNumber", e.target.value.toUpperCase())}
                      className={validationErrors.enrollmentNumber ? "border-destructive" : ""}
                      required
                    />
                    {validationErrors.enrollmentNumber && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {validationErrors.enrollmentNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Registration Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !registrationDate && "text-muted-foreground",
                          validationErrors.registrationDate && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {registrationDate ? format(registrationDate, "PPP") : "Pick registration date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={registrationDate}
                        onSelect={setRegistrationDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {validationErrors.registrationDate && (
                    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.registrationDate}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Photo Upload */}
          <div className="space-y-6">
            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Student Photo
                </CardTitle>
                <CardDescription>
                  Upload student's ID photo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Student photo"
                      className="w-full h-48 object-cover rounded-lg border border-border"
                    />
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
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-4">
                    <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Upload student photo</p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, WebP up to 5MB
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="relative"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Camera functionality will be implemented later
                      toast({
                        title: "Info",
                        description: "Camera functionality coming soon!",
                      });
                    }}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Camera
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <Card className="shadow-card bg-gradient-card">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    Register Student
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