import { supabase } from './supabase';

export interface AllowedEmail {
  id: string;
  email: string;
  added_by?: string;
  status: 'active' | 'revoked';
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Check if an email is allowed to access the application
 */
export async function isEmailAllowed(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('allowed_emails')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('status', 'active')
      .limit(1);

    if (error) {
      console.error('Error checking email access:', error);
      return false;
    }

    return !!(data && data.length > 0);
  } catch (error) {
    console.error('Error checking email access:', error);
    return false;
  }
}

/**
 * Add an email to the allowed list (owner only)
 */
export async function addAllowedEmail(
  email: string, 
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'isumenuka@gmail.com') {
      return { success: false, error: 'Unauthorized - owner access required' };
    }

    const { error } = await supabase
      .from('allowed_emails')
      .insert({
        email: email.toLowerCase(),
        added_by: user.id,
        status: 'active',
        notes: notes || null
      });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return { success: false, error: 'Email already exists in allowed list' };
      }
      console.error('Error adding email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding email:', error);
    return { success: false, error: 'Failed to add email' };
  }
}

/**
 * Remove an email from the allowed list (owner only)
 */
export async function removeAllowedEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'isumenuka@gmail.com') {
      return { success: false, error: 'Unauthorized - owner access required' };
    }

    // Prevent removing owner email
    if (email.toLowerCase() === 'isumenuka@gmail.com') {
      return { success: false, error: 'Cannot remove owner email' };
    }

    const { error } = await supabase
      .from('allowed_emails')
      .delete()
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('Error removing email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing email:', error);
    return { success: false, error: 'Failed to remove email' };
  }
}

/**
 * Revoke access for an email (soft delete - owner only)
 */
export async function revokeEmailAccess(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'isumenuka@gmail.com') {
      return { success: false, error: 'Unauthorized - owner access required' };
    }

    // Prevent revoking owner email
    if (email.toLowerCase() === 'isumenuka@gmail.com') {
      return { success: false, error: 'Cannot revoke owner access' };
    }

    const { error } = await supabase
      .from('allowed_emails')
      .update({ 
        status: 'revoked',
        updated_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('Error revoking email access:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error revoking email access:', error);
    return { success: false, error: 'Failed to revoke access' };
  }
}

/**
 * Restore access for a revoked email (owner only)
 */
export async function restoreEmailAccess(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'isumenuka@gmail.com') {
      return { success: false, error: 'Unauthorized - owner access required' };
    }

    const { error } = await supabase
      .from('allowed_emails')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('Error restoring email access:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error restoring email access:', error);
    return { success: false, error: 'Failed to restore access' };
  }
}

/**
 * Get all allowed emails (owner only)
 */
export async function getAllowedEmails(): Promise<{ emails: AllowedEmail[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'isumenuka@gmail.com') {
      return { emails: [], error: 'Unauthorized - owner access required' };
    }

    const { data, error } = await supabase
      .from('allowed_emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching allowed emails:', error);
      return { emails: [], error: error.message };
    }

    return { emails: data || [] };
  } catch (error) {
    console.error('Error fetching allowed emails:', error);
    return { emails: [], error: 'Failed to fetch emails' };
  }
}

/**
 * Update notes for an email (owner only)
 */
export async function updateEmailNotes(
  email: string, 
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'isumenuka@gmail.com') {
      return { success: false, error: 'Unauthorized - owner access required' };
    }

    const { error } = await supabase
      .from('allowed_emails')
      .update({ 
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('Error updating email notes:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating email notes:', error);
    return { success: false, error: 'Failed to update notes' };
  }
}