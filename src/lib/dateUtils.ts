import { addMonths, differenceInDays, format, isBefore, isEqual, startOfDay } from "date-fns";

/**
 * Calculate next due date based on registration date (registration + 1 month)
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
  const now = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  return differenceInDays(due, now);
}

/**
 * Get formatted due date status message
 */
export function getDueDateStatusMessage(dueDate: string): string {
  const now = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const formattedDueDate = format(due, 'dd/MM/yyyy');
  
  if (isEqual(now, due)) {
    return 'Due Today';
  } else if (isBefore(due, now)) {
    const overdueDays = Math.abs(differenceInDays(due, now));
    return `${formattedDueDate} - ${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`;
  } else {
    const daysLeft = differenceInDays(due, now);
    return `${formattedDueDate} - ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
  }
}

/**
 * Determine fee status based on due date
 */
export function getFeeStatus(dueDate: string): "paid" | "pending" | "due" | "overdue" {
  const now = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  
  if (isBefore(due, now)) {
    return "overdue";
  } else if (isEqual(due, now)) {
    return "due";
  } else if (differenceInDays(due, now) <= 7) {
    return "pending";
  }
  
  return "paid";
}