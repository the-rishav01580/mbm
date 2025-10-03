-- Update payments table to ensure proper date tracking
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS paid_at timestamptz NOT NULL DEFAULT now();

-- Add index for faster payment queries
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);

-- Update student status column
ALTER TABLE students 
ALTER COLUMN status SET DEFAULT 'active',
ALTER COLUMN status SET NOT NULL;

-- Ensure we have indexes for efficient student queries
CREATE INDEX IF NOT EXISTS idx_students_registration_date ON students(registration_date);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- Add trigger to update student status based on payments
CREATE OR REPLACE FUNCTION update_student_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update student's payment status after a payment
  UPDATE students
  SET 
    fees_paid = COALESCE(fees_paid, 0) + NEW.amount,
    updated_at = NOW()
  WHERE id = NEW.student_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_status_trigger ON payments;
CREATE TRIGGER payment_status_trigger
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_student_status();