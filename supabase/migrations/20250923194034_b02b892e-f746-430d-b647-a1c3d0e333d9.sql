-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing insecure policies
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

-- Create secure admin-only policies
CREATE POLICY "Only admins can view students" 
ON public.students 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Only admins can insert students" 
ON public.students 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update students" 
ON public.students 
FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Only admins can delete students" 
ON public.students 
FOR DELETE 
USING (public.is_admin());