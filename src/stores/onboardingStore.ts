import { create } from 'zustand';
import type { GenderType, LookingForType } from '../lib/database.types';

export interface OnboardingPhoto {
  uri: string;
  position: number;
}

export interface OnboardingPrompt {
  promptText: string;
  answerText: string;
  position: number;
}

interface OnboardingState {
  // Step data
  firstName: string;
  birthDate: Date | null;
  gender: GenderType | null;
  lookingFor: LookingForType[];
  photos: OnboardingPhoto[];
  prompts: OnboardingPrompt[];
  jobTitle: string;
  company: string;
  education: string;
  city: string;
  latitude: number | null;
  longitude: number | null;

  // Navigation
  currentStep: number;
  totalSteps: number;

  // Actions
  setFirstName: (name: string) => void;
  setBirthDate: (date: Date) => void;
  setGender: (gender: GenderType) => void;
  setLookingFor: (lookingFor: LookingForType[]) => void;
  addPhoto: (photo: OnboardingPhoto) => void;
  removePhoto: (position: number) => void;
  reorderPhotos: (photos: OnboardingPhoto[]) => void;
  setPrompt: (prompt: OnboardingPrompt) => void;
  removePrompt: (position: number) => void;
  setJobTitle: (title: string) => void;
  setCompany: (company: string) => void;
  setEducation: (education: string) => void;
  setLocation: (city: string, lat: number, lng: number) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;

  // Validation
  canProceed: () => boolean;
  isStepComplete: (step: number) => boolean;
}

const TOTAL_STEPS = 8;

const initialState = {
  firstName: '',
  birthDate: null,
  gender: null,
  lookingFor: [],
  photos: [],
  prompts: [],
  jobTitle: '',
  company: '',
  education: '',
  city: '',
  latitude: null,
  longitude: null,
  currentStep: 0,
  totalSteps: TOTAL_STEPS,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialState,

  setFirstName: (name) => set({ firstName: name }),

  setBirthDate: (date) => set({ birthDate: date }),

  setGender: (gender) => set({ gender }),

  setLookingFor: (lookingFor) => set({ lookingFor }),

  addPhoto: (photo) =>
    set((state) => {
      const existing = state.photos.findIndex((p) => p.position === photo.position);
      if (existing >= 0) {
        const newPhotos = [...state.photos];
        newPhotos[existing] = photo;
        return { photos: newPhotos };
      }
      return { photos: [...state.photos, photo].sort((a, b) => a.position - b.position) };
    }),

  removePhoto: (position) =>
    set((state) => ({
      photos: state.photos.filter((p) => p.position !== position),
    })),

  reorderPhotos: (photos) => set({ photos }),

  setPrompt: (prompt) =>
    set((state) => {
      const existing = state.prompts.findIndex((p) => p.position === prompt.position);
      if (existing >= 0) {
        const newPrompts = [...state.prompts];
        newPrompts[existing] = prompt;
        return { prompts: newPrompts };
      }
      return { prompts: [...state.prompts, prompt].sort((a, b) => a.position - b.position) };
    }),

  removePrompt: (position) =>
    set((state) => ({
      prompts: state.prompts.filter((p) => p.position !== position),
    })),

  setJobTitle: (title) => set({ jobTitle: title }),

  setCompany: (company) => set({ company }),

  setEducation: (education) => set({ education }),

  setLocation: (city, lat, lng) =>
    set({ city, latitude: lat, longitude: lng }),

  setCurrentStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS - 1),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),

  reset: () => set(initialState),

  canProceed: () => {
    const state = get();
    return state.isStepComplete(state.currentStep);
  },

  isStepComplete: (step) => {
    const state = get();
    switch (step) {
      case 0: // First name
        return state.firstName.trim().length >= 2;
      case 1: // Birthday
        if (!state.birthDate) return false;
        const age = Math.floor(
          (Date.now() - state.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
        return age >= 18;
      case 2: // Gender
        return state.gender !== null;
      case 3: // Looking for
        return state.lookingFor.length > 0;
      case 4: // Photos
        return state.photos.length >= 2;
      case 5: // Prompts
        return state.prompts.length >= 3 &&
          state.prompts.every((p) => p.answerText.trim().length >= 10);
      case 6: // Job & Education (optional)
        return true;
      case 7: // Location
        return true; // Optional, can skip
      default:
        return false;
    }
  },
}));
