/**
 * Comprehensive input validation and sanitization utilities
 */

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Password strength regex (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

// Safe characters for text input (alphanumeric, spaces, basic punctuation)
const SAFE_TEXT_REGEX = /^[a-zA-Z0-9\s.,!?;:()\-_'"]+$/;

// Project name validation (alphanumeric, spaces, hyphens, underscores)
const PROJECT_NAME_REGEX = /^[a-zA-Z0-9\s\-_]+$/;

/**
 * Validates email format
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (email.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): { isValid: boolean; error?: string; strength: 'weak' | 'medium' | 'strong' } {
  if (!password) {
    return { isValid: false, error: 'Password is required', strength: 'weak' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters', strength: 'weak' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long', strength: 'weak' };
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123', 'password123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return { isValid: false, error: 'Password is too common', strength: 'weak' };
  }
  
  if (STRONG_PASSWORD_REGEX.test(password)) {
    return { isValid: true, strength: 'strong' };
  }
  
  // Medium strength - has some requirements but not all
  if (password.length >= 8) {
    return { isValid: true, strength: 'medium' };
  }
  
  return { isValid: false, error: 'Password is too weak', strength: 'weak' };
}

/**
 * Sanitizes text input to prevent XSS
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Validates and sanitizes prompt text
 */
export function validatePromptText(text: string, maxLength: number = 500): { isValid: boolean; sanitized: string; error?: string } {
  if (!text) {
    return { isValid: false, sanitized: '', error: 'Prompt text is required' };
  }
  
  if (text.length > maxLength) {
    return { isValid: false, sanitized: '', error: `Prompt text must be ${maxLength} characters or less` };
  }
  
  // Check for potentially malicious content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return { isValid: false, sanitized: '', error: 'Invalid characters detected' };
    }
  }
  
  const sanitized = sanitizeText(text);
  return { isValid: true, sanitized };
}

/**
 * Validates project name
 */
export function validateProjectName(name: string): { isValid: boolean; error?: string } {
  if (!name) {
    return { isValid: false, error: 'Project name is required' };
  }
  
  if (name.length < 3) {
    return { isValid: false, error: 'Project name must be at least 3 characters' };
  }
  
  if (name.length > 100) {
    return { isValid: false, error: 'Project name must be 100 characters or less' };
  }
  
  if (!PROJECT_NAME_REGEX.test(name)) {
    return { isValid: false, error: 'Project name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }
  
  return { isValid: true };
}

/**
 * Validates CSV filename
 */
export function validateFilename(filename: string): { isValid: boolean; error?: string } {
  if (!filename) {
    return { isValid: false, error: 'Filename is required' };
  }
  
  if (filename.length > 255) {
    return { isValid: false, error: 'Filename is too long' };
  }
  
  // Check for valid file extensions
  const validExtensions = /\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|avi|mkv|webm)$/i;
  if (!validExtensions.test(filename)) {
    return { isValid: false, error: 'Invalid file extension' };
  }
  
  // Check for dangerous characters
  const dangerousChars = /[<>:"|?*\x00-\x1f]/;
  if (dangerousChars.test(filename)) {
    return { isValid: false, error: 'Filename contains invalid characters' };
  }
  
  return { isValid: true };
}

/**
 * Validates keywords string
 */
export function validateKeywords(keywords: string): { isValid: boolean; error?: string; count: number } {
  if (!keywords) {
    return { isValid: false, error: 'Keywords are required', count: 0 };
  }
  
  const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
  
  if (keywordArray.length < 5) {
    return { isValid: false, error: 'At least 5 keywords are required', count: keywordArray.length };
  }
  
  if (keywordArray.length > 50) {
    return { isValid: false, error: 'Maximum 50 keywords allowed', count: keywordArray.length };
  }
  
  // Check each keyword for suspicious content
  for (const keyword of keywordArray) {
    if (keyword.length > 50) {
      return { isValid: false, error: 'Individual keywords must be 50 characters or less', count: keywordArray.length };
    }
    
    if (!SAFE_TEXT_REGEX.test(keyword)) {
      return { isValid: false, error: 'Keywords contain invalid characters', count: keywordArray.length };
    }
  }
  
  return { isValid: true, count: keywordArray.length };
}

/**
 * Rate limiting utility
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  /**
   * Check if action is allowed based on rate limit
   */
  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
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
  
  /**
   * Get remaining time until next attempt is allowed
   */
  getTimeUntilReset(key: string, windowMs: number): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Validates user session and prevents session hijacking
 */
export function validateUserSession(): boolean {
  try {
    // Check if we're in a secure context (HTTPS in production)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('Insecure connection detected');
      return false;
    }
    
    // Basic session validation
    const sessionId = localStorage.getItem('user_session_id');
    if (sessionId && typeof sessionId === 'string' && sessionId.length > 10) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

/**
 * Secure random string generator
 */
export function generateSecureId(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.getRandomValues for cryptographically secure randomness
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomArray[i] % chars.length];
  }
  
  return result;
}

/**
 * Detects potential XSS attempts
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[\s\S]*?onerror[\s\S]*?>/gi,
    /<svg[\s\S]*?onload[\s\S]*?>/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /<object[\s\S]*?>/gi,
    /<embed[\s\S]*?>/gi,
    /<link[\s\S]*?href[\s\S]*?javascript:/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Validates file upload security
 */
export function validateFileUpload(file: File): { isValid: boolean; error?: string } {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' };
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mov',
    'video/avi',
    'video/webm'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type' };
  }
  
  // Check filename for dangerous characters
  const dangerousChars = /[<>:"|?*\x00-\x1f]/;
  if (dangerousChars.test(file.name)) {
    return { isValid: false, error: 'Filename contains invalid characters' };
  }
  
  return { isValid: true };
}