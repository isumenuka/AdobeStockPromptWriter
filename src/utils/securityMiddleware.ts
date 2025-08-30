/**
 * Security middleware for API requests and data handling
 */

import { SecureRequest } from './securityUtils';

/**
 * Secure API wrapper for Supabase requests
 */
export class SecureSupabaseClient {
  /**
   * Wraps Supabase queries with additional security checks
   */
  static async executeQuery<T>(
    queryFunction: () => Promise<{ data: T | null; error: any }>,
    context: string
  ): Promise<{ data: T | null; error: any }> {
    try {
      // Log the query context for security monitoring
      console.log(`Executing secure query: ${context}`);
      
      const startTime = Date.now();
      const result = await queryFunction();
      const duration = Date.now() - startTime;
      
      // Monitor for unusually slow queries (potential DoS)
      if (duration > 10000) { // 10 seconds
        console.warn(`Slow query detected: ${context} took ${duration}ms`);
      }
      
      // Log errors for security monitoring
      if (result.error) {
        console.error(`Query error in ${context}:`, result.error);
      }
      
      return result;
    } catch (error) {
      console.error(`Security wrapper error in ${context}:`, error);
      return { data: null, error };
    }
  }
}

/**
 * Request interceptor for additional security
 */
export class RequestInterceptor {
  private static blockedIPs: Set<string> = new Set();
  private static suspiciousPatterns: RegExp[] = [
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /<script/i,
    /javascript:/i,
    /eval\(/i,
    /document\.cookie/i
  ];
  
  /**
   * Validates request before sending
   */
  static validateRequest(url: string, data?: any): { isValid: boolean; reason?: string } {
    // Check URL for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(url)) {
        return { isValid: false, reason: 'Suspicious URL pattern detected' };
      }
    }
    
    // Check request data for suspicious content
    if (data) {
      const dataString = JSON.stringify(data);
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(dataString)) {
          return { isValid: false, reason: 'Suspicious data pattern detected' };
        }
      }
    }
    
    return { isValid: true };
  }
  
  /**
   * Logs suspicious activity
   */
  static logSuspiciousActivity(reason: string, details: any): void {
    console.warn('🚨 Security Alert:', reason, details);
    
    // In a production environment, you might want to send this to a security monitoring service
    // Example: sendToSecurityService({ reason, details, timestamp: new Date().toISOString() });
  }
}

/**
 * Data sanitization middleware
 */
export class DataSanitizer {
  /**
   * Sanitizes object properties recursively
   */
  static sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeValue(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key name
      const cleanKey = this.sanitizeValue(key);
      sanitized[cleanKey] = this.sanitizeObject(value);
    }
    
    return sanitized;
  }
  
  private static sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      return value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
    }
    
    return value;
  }
}

/**
 * Security event logger
 */
export class SecurityLogger {
  private static events: Array<{
    timestamp: string;
    type: string;
    details: any;
    userAgent: string;
    url: string;
  }> = [];
  
  /**
   * Logs security events
   */
  static logEvent(type: string, details: any): void {
    const event = {
      timestamp: new Date().toISOString(),
      type,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.events.push(event);
    
    // Keep only last 100 events to prevent memory issues
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('Security Event:', event);
    }
  }
  
  /**
   * Gets recent security events
   */
  static getEvents(): typeof SecurityLogger.events {
    return [...this.events];
  }
  
  /**
   * Clears security event log
   */
  static clearEvents(): void {
    this.events = [];
  }
}