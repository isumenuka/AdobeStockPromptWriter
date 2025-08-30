/**
 * Security utilities for protecting against common web vulnerabilities
 */

/**
 * Secure localStorage wrapper with encryption-like obfuscation
 */
class SecureStorage {
  private static encode(value: string): string {
    // Simple obfuscation (not real encryption, but better than plain text)
    return btoa(encodeURIComponent(value));
  }
  
  private static decode(value: string): string {
    try {
      return decodeURIComponent(atob(value));
    } catch {
      return value; // Fallback for non-encoded values
    }
  }
  
  static setItem(key: string, value: any): void {
    try {
      const encoded = this.encode(JSON.stringify(value));
      localStorage.setItem(key, encoded);
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
    }
  }
  
  static getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      
      const decoded = this.decode(item);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return defaultValue;
    }
  }
  
  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }
  
  static clear(): void {
    localStorage.clear();
  }
}

/**
 * CSRF protection utilities
 */
export class CSRFProtection {
  private static token: string | null = null;
  
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return this.token;
  }
  
  static getToken(): string | null {
    return this.token;
  }
  
  static validateToken(token: string): boolean {
    return this.token === token;
  }
}

/**
 * Request security wrapper
 */
export class SecureRequest {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;
  
  /**
   * Secure fetch wrapper with retry logic and validation
   */
  static async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Validate URL
    if (!this.isValidUrl(url)) {
      throw new Error('Invalid URL');
    }
    
    // Add security headers
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers,
      },
    };
    
    // Add CSRF token if available
    const csrfToken = CSRFProtection.getToken();
    if (csrfToken) {
      secureOptions.headers = {
        ...secureOptions.headers,
        'X-CSRF-Token': csrfToken,
      };
    }
    
    let lastError: Error;
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, secureOptions);
        
        // Check for suspicious response headers
        this.validateResponseHeaders(response);
        
        return response;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.MAX_RETRIES - 1) {
          await this.delay(this.RETRY_DELAY * (attempt + 1));
        }
      }
    }
    
    throw lastError!;
  }
  
  private static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Only allow HTTPS (except localhost for development)
      if (urlObj.protocol !== 'https:' && !url.includes('localhost')) {
        return false;
      }
      
      // Whitelist allowed domains
      const allowedDomains = [
        'localhost',
        'brgqpigmzbpxvtosdqlx.supabase.co',
        'generativelanguage.googleapis.com',
        'www.google.com',
        'www.gstatic.com'
      ];
      
      return allowedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }
  
  private static validateResponseHeaders(response: Response): void {
    // Check for suspicious headers that might indicate an attack
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html') && !response.url.includes('localhost')) {
      console.warn('Unexpected HTML response from API endpoint');
    }
  }
  
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Session security manager
 */
export class SessionSecurity {
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Initialize session security monitoring
   */
  static initialize(): void {
    this.setupActivityMonitoring();
    this.setupVisibilityChangeHandler();
    this.setupBeforeUnloadHandler();
  }
  
  private static setupActivityMonitoring(): void {
    let lastActivity = Date.now();
    
    const updateActivity = () => {
      lastActivity = Date.now();
    };
    
    // Monitor user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    
    // Check for session timeout
    setInterval(() => {
      if (Date.now() - lastActivity > this.SESSION_TIMEOUT) {
        this.handleSessionTimeout();
      }
    }, this.ACTIVITY_CHECK_INTERVAL);
  }
  
  private static setupVisibilityChangeHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden - could implement additional security measures
        console.log('Page hidden - monitoring for security');
      }
    });
  }
  
  private static setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      // Clean up sensitive data before page unload
      this.cleanupSensitiveData();
    });
  }
  
  private static handleSessionTimeout(): void {
    console.warn('Session timeout detected');
    // Could implement automatic logout here
    // For now, just log the event
  }
  
  private static cleanupSensitiveData(): void {
    // Clear any sensitive data from memory
    // This is a placeholder for cleanup logic
    console.log('Cleaning up sensitive data');
  }
}

/**
 * Content validation for user-generated content
 */
export class ContentValidator {
  private static readonly BLOCKED_WORDS = [
    'script', 'javascript', 'vbscript', 'onload', 'onerror', 'onclick',
    'eval', 'expression', 'import', 'document.cookie', 'window.location'
  ];
  
  /**
   * Validates user-generated content for security threats
   */
  static validateContent(content: string): { isValid: boolean; threats: string[] } {
    const threats: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Check for blocked words
    this.BLOCKED_WORDS.forEach(word => {
      if (lowerContent.includes(word)) {
        threats.push(`Blocked word detected: ${word}`);
      }
    });
    
    // Check for HTML tags
    if (/<[^>]*>/g.test(content)) {
      threats.push('HTML tags detected');
    }
    
    // Check for URL schemes that could be dangerous
    const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
    dangerousSchemes.forEach(scheme => {
      if (lowerContent.includes(scheme)) {
        threats.push(`Dangerous URL scheme detected: ${scheme}`);
      }
    });
    
    return {
      isValid: threats.length === 0,
      threats
    };
  }
}

/**
 * Environment security checker
 */
export class EnvironmentSecurity {
  /**
   * Checks if the application is running in a secure environment
   */
  static checkEnvironment(): { isSecure: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    // Check HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      warnings.push('Application is not served over HTTPS');
    }
    
    // Check for development mode indicators
    if (import.meta.env.DEV) {
      warnings.push('Application is running in development mode');
    }
    
    // Check for exposed development tools
    if (window.location.search.includes('debug=true')) {
      warnings.push('Debug mode is enabled');
    }
    
    // Check for required environment variables
    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_GEMINI_API_KEY'];
    requiredEnvVars.forEach(envVar => {
      if (!import.meta.env[envVar]) {
        warnings.push(`Missing environment variable: ${envVar}`);
      }
    });
    
    return {
      isSecure: warnings.length === 0,
      warnings
    };
  }
}

export { SecureStorage };