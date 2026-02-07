import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasProfile: boolean;

  // Phone auth flow
  phoneNumber: string;
  countryCode: string;
  isVerifying: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setHasProfile: (hasProfile: boolean) => void;
  setPhoneNumber: (phone: string) => void;
  setCountryCode: (code: string) => void;
  setVerifying: (verifying: boolean) => void;
  signOut: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  hasProfile: false,
  phoneNumber: '',
  countryCode: '+1',
  isVerifying: false,
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

  setPhoneNumber: (phoneNumber) => set({ phoneNumber }),

  setCountryCode: (countryCode) => set({ countryCode }),

  setVerifying: (isVerifying) => set({ isVerifying }),

  signOut: async () => {
    await supabase.auth.signOut();
    set(initialState);
  },

  reset: () => set(initialState),
}));
