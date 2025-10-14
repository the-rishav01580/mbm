import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layouts and Auth
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Pages
import Dashboard from "./pages/Dashboard";
import Registration from "./pages/Registration";
import Profiles from "./pages/Profiles";
import FeesDue from "./pages/FeesDue";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import StudentProfile from "./pages/StudentProfile";
// 👇 1. Yahan apne naye component ko import karein 👇
import UpdatePassword from "./pages/UpdatePassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={<Auth />} />
            {/* 👇 2. Yahan naya password reset route add karein 👇 */}
            <Route path="/update-password" element={<UpdatePassword />} />

            {/* Protected Routes */}
            <Route path="/*" element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/registration" element={<Registration />} />
                    <Route path="/profiles" element={<Profiles />} />
                    <Route path="/students/:id" element={<StudentProfile />} />                   
                    <Route path="/fees-due" element={<FeesDue />} />
    
                    {/* Catch-all for protected routes */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;