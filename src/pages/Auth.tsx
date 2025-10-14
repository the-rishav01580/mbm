import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client"; // Path sahi hai ya nahi, check karein
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

const isEmail = (input: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState(""); // Email ya Phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState(""); // Forgot password ke liye
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginIdentifier || !password) {
      setError("Email/Phone and password are required.");
      return;
    }
    setLoading(true);

    const isLoginWithEmail = isEmail(loginIdentifier);

    const { error } = await supabase.auth.signInWithPassword({
      ...(isLoginWithEmail ? { email: loginIdentifier } : { phone: loginIdentifier }),
      password,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      toast({ title: "Sign In Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Welcome back!" });
      navigate("/"); // Dashboard ya home page par redirect karein
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!resetEmail) {
      setError("Please enter your email to reset password.");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      // Yeh woh URL hai jahan user email me link click karne ke baad jayega
      redirectTo: `${window.location.origin}/update-password`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for instructions to reset your password.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Mess Management System</CardTitle>
          <CardDescription className="text-center">Admin Access</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="forgot">Forgot Password</TabsTrigger>
            </TabsList>
            
            {/* Sign In Tab */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-identifier">Email or Phone</Label>
                  <Input
                    id="login-identifier"
                    placeholder="admin@example.com or +91XXXXXXXXXX"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            {/* Forgot Password Tab */}
            <TabsContent value="forgot">
              <form onSubmit={handlePasswordReset} className="space-y-4 pt-4">
                <CardDescription>Enter your email below to receive a password reset link.</CardDescription>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                {error && (
                   <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;


// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { supabase } from "@/integrations/supabase/client";
// import { useToast } from "@/hooks/use-toast";
// import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
// import { validateEmail, validatePassword, authRateLimiter } from "@/lib/validation";

// const Auth = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   const validateForm = (): boolean => {
//     const errors: Record<string, string> = {};
    
//     const emailValidation = validateEmail(email);
//     if (!emailValidation.isValid) {
//       errors.email = emailValidation.error!;
//     }
    
//     const passwordValidation = validatePassword(password);
//     if (!passwordValidation.isValid) {
//       errors.password = passwordValidation.error!;
//     }
    
//     setValidationErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const handleSignIn = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       return;
//     }
    
//     // Rate limiting
//     if (!authRateLimiter.canAttempt('signin:' + email, 5, 15 * 60 * 1000)) {
//       const remainingTime = Math.ceil(authRateLimiter.getRemainingTime('signin:' + email, 15 * 60 * 1000) / 1000 / 60);
//       toast({
//         title: "Too Many Attempts",
//         description: `Please wait ${remainingTime} minutes before trying again`,
//         variant: "destructive",
//       });
//       return;
//     }
    
//     setIsLoading(true);

//     try {
//       const { error } = await supabase.auth.signInWithPassword({
//         email,
//         password,
//       });

//       if (error) {
//         toast({
//           title: "Error",
//           description: error.message,
//           variant: "destructive",
//         });
//       } else {
//         toast({
//           title: "Success",
//           description: "Welcome back!",
//         });
//         navigate("/");
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "An unexpected error occurred",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleInputChange = (field: 'email' | 'password', value: string) => {
//     if (field === 'email') {
//       setEmail(value);
//     } else {
//       setPassword(value);
//     }
    
//     // Clear validation errors when user starts typing
//     if (validationErrors[field]) {
//       setValidationErrors(prev => ({ ...prev, [field]: '' }));
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-background p-4">
//       <Card className="w-full max-w-md">
//         <CardHeader className="space-y-1">
//           <CardTitle className="text-2xl text-center">Student Management System</CardTitle>
//           <CardDescription className="text-center">
//             Admin access required
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSignIn} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="signin-email">Email</Label>
//               <Input
//                 id="signin-email"
//                 type="email"
//                 placeholder="admin@example.com"
//                 value={email}
//                 onChange={(e) => handleInputChange('email', e.target.value)}
//                 className={validationErrors.email ? "border-destructive" : ""}
//                 required
//               />
//               {validationErrors.email && (
//                 <p className="text-sm text-destructive flex items-center gap-1 mt-1">
//                   <AlertCircle className="h-4 w-4" />
//                   {validationErrors.email}
//                 </p>
//               )}
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="signin-password">Password</Label>
//               <div className="relative">
//                 <Input
//                   id="signin-password"
//                   type={showPassword ? "text" : "password"}
//                   value={password}
//                   onChange={(e) => handleInputChange('password', e.target.value)}
//                   className={validationErrors.password ? "border-destructive pr-10" : "pr-10"}
//                   required
//                 />
//                 <Button
//                   type="button"
//                   variant="ghost"
//                   size="sm"
//                   className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                   onClick={() => setShowPassword(!showPassword)}
//                 >
//                   {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                 </Button>
//               </div>
//               {validationErrors.password && (
//                 <p className="text-sm text-destructive flex items-center gap-1 mt-1">
//                   <AlertCircle className="h-4 w-4" />
//                   {validationErrors.password}
//                 </p>
//               )}
//             </div>
//             <Button type="submit" className="w-full" disabled={isLoading}>
//               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//               Sign In
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default Auth;
