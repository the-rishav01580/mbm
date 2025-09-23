// Input validation and sanitization utilities

export const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const enrollmentRegex = /^[0-9]{2}[A-Z]{2}[0-9]{3,4}$/;
export const nameRegex = /^[a-zA-Z\s.'-]+$/;

// File validation constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Validation functions
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
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  if (email.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }
  return { isValid: true };
};

export const validateName = (name: string, fieldName: string = 'Name'): { isValid: boolean; error?: string } => {
  if (!name || !name.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (name.length < 2) {
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
  if (!enrollmentNumber) {
    return { isValid: false, error: 'Enrollment number is required' };
  }
  const cleaned = enrollmentNumber.toUpperCase().replace(/\s+/g, '');
  if (!enrollmentRegex.test(cleaned)) {
    return { isValid: false, error: 'Enrollment number must be in format: 20CS001 (2 digits + 2 letters + 3-4 digits)' };
  }
  return { isValid: true };
};

export const validatePassword = (password: string): { isValid: boolean; error?: string; strength: 'weak' | 'medium' | 'strong' } => {
  if (!password) {
    return { isValid: false, error: 'Password is required', strength: 'weak' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long', strength: 'weak' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password must be less than 128 characters', strength: 'weak' };
  }
  
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const criteriaMet = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecial].filter(Boolean).length;
  
  if (criteriaMet < 3) {
    return {
      isValid: false,
      error: 'Password must contain at least 3 of: lowercase, uppercase, numbers, special characters',
      strength: 'weak'
    };
  }
  
  // Check for common weak patterns
  const commonPatterns = [
    /^(.)\1+$/, // All same character
    /^(123|abc|qwerty|password)/i, // Common sequences
    /(password|admin|user|login)/i // Common words
  ];
  
  if (commonPatterns.some(pattern => pattern.test(password))) {
    return {
      isValid: false,
      error: 'Password contains common patterns. Please choose a more secure password.',
      strength: 'weak'
    };
  }
  
  const strength = criteriaMet === 4 && password.length >= 12 ? 'strong' : 'medium';
  return { isValid: true, strength };
};

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: 'File is required' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }
  
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }
  
  // Additional check for file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  if (!extension || !allowedExtensions.includes(extension)) {
    return { isValid: false, error: 'Invalid file extension. Use .jpg, .jpeg, .png, or .webp' };
  }
  
  return { isValid: true };
};

// Sanitization functions
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/[^\d+]/g, ''); // Keep only digits and +
};

export const formatPhone = (phone: string): string => {
  const cleaned = sanitizePhone(phone);
  // Format as +91 XXXXX XXXXX for display
  if (cleaned.startsWith('+91')) {
    const number = cleaned.slice(3);
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  } else if (cleaned.startsWith('91')) {
    const number = cleaned.slice(2);
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  } else if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return cleaned;
};

// Rate limiting helpers (client-side)
export class ClientRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  canAttempt(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }
  
  getRemainingTime(key: string, windowMs: number = 15 * 60 * 1000): number {
    const attempts = this.attempts.get(key) || [];
    const oldestAttempt = Math.min(...attempts);
    return Math.max(0, windowMs - (Date.now() - oldestAttempt));
  }
}

export const authRateLimiter = new ClientRateLimiter();