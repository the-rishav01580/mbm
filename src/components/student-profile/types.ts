// src/components/student-profile/types.ts

export type PaymentMethod = "Cash" | "Online";
export type PaymentStatus = "completed" | "pending";

export interface Student {
  id: string;
  name: string;
  phone: string;
  father_name: string;
  father_phone: string;
  branch: string;
  enrollment_number: string;
  registration_date: string;
  photo_url?: string;
  status: 'active' | 'fees_due' | 'inactive';
  fees_paid: number;
  fees_due: number;
}

export interface PaymentTransaction {
  id: string;
  payment_date: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  notes?: string;
  student_id: string;
}

export interface PaymentFormState {
  id?: string;
  date: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  notes: string;
}