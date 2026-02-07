import { supabase } from '../../../lib/supabase';

export interface SignUpData {
  phone: string;
}

export interface VerifyOTPData {
  phone: string;
  token: string;
}

export const authService = {
  /**
   * Send OTP to phone number
   */
  async sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to send verification code' };
    }
  },

  /**
   * Verify OTP code
   */
  async verifyOTP(
    phone: string,
    token: string
  ): Promise<{ success: boolean; isNewUser: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) {
        return { success: false, isNewUser: false, error: error.message };
      }

      // Check if user has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user?.id)
        .single();

      return {
        success: true,
        isNewUser: !profile,
      };
    } catch (error) {
      return { success: false, isNewUser: false, error: 'Verification failed' };
    }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to sign out' };
    }
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    return { user: data.user, error };
  },

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('delete_account');

      if (error) {
        return { success: false, error: error.message };
      }

      // Sign out after deleting account
      await supabase.auth.signOut();

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete account' };
    }
  },
};
