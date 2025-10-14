// src/lib/validation.ts

// --- Constants ---
export const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// --- FIX: Enrollment regex is no longer needed for format validation ---
// export const enrollmentRegex = /^[0-9]{2}[A-Z]{2}[0-9]{3,4}$/;

export const nameRegex = /^[a-zA-Z\s.'-]+$/;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// --- Validation Functions ---


export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  const cleaned = phone.replace(/\s+/g, '').replace(/[-()]/g, '');
  
  if (!cleaned) {
    return { isValid: false, error: 'Phone number is required' };
  }
  if (!phoneRegex.test(cleaned)) {
    return { isValid: false, error: 'Please enter a valid Indian phone number (10 digits)' };
  }
  return { isValid: true };
};

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  // ... (This function is fine, no changes needed)
  if (!email) { return { isValid: false, error: 'Email is required' }; }
  if (!emailRegex.test(email)) { return { isValid: false, error: 'Please enter a valid email address' }; }
  if (email.length > 254) { return { isValid: false, error: 'Email address is too long' }; }
  return { isValid: true };
};

export const validateName = (name: string, fieldName: string = 'Name'): { isValid: boolean; error?: string } => {
  // --- FIX: This function already allows spaces, so it's correct as per your requirement. No changes needed. ---
  if (!name || !name.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long` };
  }
  if (name.length > 100) {
    return { isValid: false, error: `${fieldName} must be less than 100 characters` };
  }
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, apostrophes, hyphens, and periods` };
  }
  return { isValid: true };
};

export const validateEnrollmentNumber = (enrollmentNumber: string): { isValid: boolean; error?: string } => {
  // --- FIX: All format validation logic has been removed. ---
  // Step 1: Check if the enrollment number is empty or just contains spaces.
  if (!enrollmentNumber || enrollmentNumber.trim() === '') {
    return { isValid: false, error: 'Enrollment number is required.' };
  }
  
  // Step 2 (Optional): You can add a minimum length check if you want.
  // if (enrollmentNumber.trim().length < 4) {
  //   return { isValid: false, error: 'Enrollment number must be at least 4 characters long.' };
  
  // If the checks pass, it's valid.
  return { isValid: true };
};

export const validatePassword = (password: string): { isValid: boolean; error?: string; strength: 'weak' | 'medium' | 'strong' } => {
  // ... (This function is fine, no changes needed)
  if (!password) { return { isValid: false, error: 'Password is required', strength: 'weak' }; }
  if (password.length < 8) { return { isValid: false, error: 'Password must be at least 8 characters long', strength: 'weak' }; }
  // ... (rest of the password logic is fine)
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=```math```{};':"\\|,.<>\/?]/.test(password);
  const criteriaMet = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecial].filter(Boolean).length;
  if (criteriaMet < 3) { return { isValid: false, error: 'Password must contain at least 3 of: lowercase, uppercase, numbers, special characters', strength: 'weak' }; }
  const strength = criteriaMet === 4 && password.length >= 12 ? 'strong' : 'medium';
  return { isValid: true, strength };
};

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  if (!file) { return { isValid: false, error: 'File is required' }; }
  if (file.size > MAX_FILE_SIZE) { return { isValid: false, error: 'File size must be less than 5MB' }; }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { return { isValid: false, error: 'Only JPEG, PNG, and WebP images are allowed' }; }
  return { isValid: true };
};

// --- Sanitization Functions ---

export const sanitizeInput = (input: string): string => {

  // --- FIX: This function now correctly handles spaces. It trims start/end spaces and collapses multiple spaces into one. ---
  // It does NOT remove all spaces, so "Rishav Garg" will remain "Rishav Garg".
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with a single space
};

export const sanitizePhone = (phone: string): string => {

  // ... (This function is fine, no changes needed)
  return phone.replace(/[^\d+]/g, '');
};

export const formatPhone = (phone: string): string => {
  // ... (This function is fine, no changes needed)
  const cleaned = sanitizePhone(phone);
  if (cleaned.length === 10) { return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`; }
  return cleaned;
};

// --- Rate Limiting (This part is fine, no changes needed) ---
export class ClientRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  canAttempt(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const validAttempts = attempts.filter(time => now - time < windowMs);
    if (validAttempts.length >= maxAttempts) return false;
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
}
export const authRateLimiter = new ClientRateLimiter();