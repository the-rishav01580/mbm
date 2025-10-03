-- Payments table to track student fee payments
CREATE TYPE public.payment_method AS ENUM ('cash', 'online');
CREATE TYPE public.payment_status AS ENUM ('completed', 'pending');

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  method public.payment_method NOT NULL DEFAULT 'cash',
  status public.payment_status NOT NULL DEFAULT 'completed',
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payments"
ON public.payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert payments"
ON public.payments FOR INSERT TO authenticated WITH CHECK (true);

-- Optional: maintain students.fees_paid and fees_due via trigger
CREATE OR REPLACE FUNCTION public.apply_payment_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.students
    SET 
      fees_paid = COALESCE(fees_paid, 0) + NEW.amount,
      fees_due = GREATEST(0, COALESCE(fees_due, 0) - NEW.amount),
      updated_at = now()
    WHERE id = NEW.student_id;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER on_payment_insert
AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.apply_payment_update();


