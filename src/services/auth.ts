import { supabase } from './supabase';
import { isEmailAllowed } from './emailAccess';
import { SecurityLogger } from '../utils/securityMiddleware';
import type { User, AuthError } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp({ email, password, firstName, lastName }: SignUpData) {
  try {
    // Log authentication attempt
    SecurityLogger.logEvent('auth_signup_attempt', { email });
    
    // Check if email is allowed
    const emailAllowed = await isEmailAllowed(email);
    if (!emailAllowed) {
      SecurityLogger.logEvent('auth_signup_denied', { email, reason: 'email_not_allowed' });
      return { 
        data: null, 
        error: { 
          message: 'This email is not authorized to access this application. Please contact the owner for access.' 
        } as AuthError 
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        // Disable email confirmation - users can sign in immediately
        emailRedirectTo: undefined
      }
    });

    if (error) throw error;
    
    SecurityLogger.logEvent('auth_signup_success', { email });
    return { data, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    SecurityLogger.logEvent('auth_signup_error', { email, error: (error as Error).message });
    return { data: null, error: error as AuthError };
  }
}

/**
 * Sign in an existing user
 */
export async function signIn({ email, password }: SignInData) {
  try {
    // Log authentication attempt
    SecurityLogger.logEvent('auth_signin_attempt', { email });
    
    // Check if email is allowed
    const emailAllowed = await isEmailAllowed(email);
    if (!emailAllowed) {
      SecurityLogger.logEvent('auth_signin_denied', { email, reason: 'email_not_allowed' });
      return { 
        data: null, 
        error: { 
          message: 'This email is not authorized to access this application. Please contact the owner for access.' 
        } as AuthError 
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        skipConfirmation: true
      }
    });

    if (error) throw error;
    
    SecurityLogger.logEvent('auth_signin_success', { email });
    return { data, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    SecurityLogger.logEvent('auth_signin_error', { email, error: (error as Error).message });
    return { data: null, error: error as AuthError };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error: error as AuthError };
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    console.error('Get current user error:', error);
    return { user: null, error: error as AuthError };
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Reset password error:', error);
    return { error: error as AuthError };
  }
}

/**
 * Update user password
 */
export async function updatePassword(password: string) {
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Update password error:', error);
    return { error: error as AuthError };
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteAccount() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: { message: 'No user found' } as AuthError };
    }

    // Delete user account (this will cascade delete all related data due to foreign key constraints)
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error('Delete account error:', error);
    return { error: error as AuthError };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session?.user?.email);
    callback(session?.user ?? null);
  });
}