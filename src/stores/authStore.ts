import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasProfile: boolean;

  // Email auth flow
  email: string;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setHasProfile: (hasProfile: boolean) => void;
  setEmail: (email: string) => void;
  signOut: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  hasProfile: false,
  email: '',
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setHasProfile: (hasProfile) => set({ hasProfile }),

  setEmail: (email) => set({ email }),

  signOut: async () => {
    await supabase.auth.signOut();
    set(initialState);
  },

  reset: () => set(initialState),
}));
