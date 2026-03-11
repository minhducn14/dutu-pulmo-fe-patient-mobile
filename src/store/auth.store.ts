import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

type AuthUser = {
  id: string;
  fullName?: string;
  avatarUrl?: string;
  status?: string;
  doctorId?: string;
  patientId?: string;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setSession: (payload: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser | null;
  }) => void;
  clearSession: () => void;
  setUser: (user: AuthUser | null) => void;
  setHydrated: (value: boolean) => void;
};

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => SecureStore.getItemAsync(name),
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),
      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
      setUser: (user) => set({ user }),
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
