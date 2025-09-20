import { addMonths, differenceInDays } from "date-fns";

/**
 * Calculate due date based on registration date (registration + 1 month)
 */
export function calculateDueDate(registrationDate: string): string {
  const regDate = new Date(registrationDate);
  const dueDate = addMonths(regDate, 1);
  return dueDate.toISOString().split('T')[0];
}

/**
 * Calculate days until due date
 */
export function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  const due = new Date(dueDate);
  return differenceInDays(due, today);
}

/**
 * Determine fee status based on due date
 */
export function getFeeStatus(dueDate: string): "paid" | "pending" | "overdue" {
  const daysUntil = getDaysUntilDue(dueDate);
  
  if (daysUntil < 0) {
    return "overdue";
  } else if (daysUntil <= 7) {
    return "pending";
  }
  
  return "paid"; // This would typically be determined by actual payment status
}