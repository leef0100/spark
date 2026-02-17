import { supabase } from '../../../lib/supabase';

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string
  ): Promise<{ success: boolean; isNewUser: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, isNewUser: false, error: error.message };
      }

      // Check if user already has a profile
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        return {
          success: true,
          isNewUser: !profile,
        };
      }

      return { success: true, isNewUser: true };
    } catch (error) {
      return { success: false, isNewUser: false, error: 'Sign up failed' };
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(
    email: string,
    password: string
  ): Promise<{ success: boolean; isNewUser: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, isNewUser: false, error: error.message };
      }

      // Check if user has a profile
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        return {
          success: true,
          isNewUser: !profile,
        };
      }

      return { success: true, isNewUser: false };
    } catch (error) {
      return { success: false, isNewUser: false, error: 'Sign in failed' };
    }
  },

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to send reset email' };
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
