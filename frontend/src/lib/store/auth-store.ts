"use client";

import { create } from "zustand";
import type { UserProfile } from "@/lib/api/types";
import {
  clearStoredTokens,
  readStoredTokens,
  writeStoredTokens,
} from "@/lib/auth/token-storage";

interface AuthState {
  hydrated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (payload: {
    user: UserProfile;
    accessToken: string;
    refreshToken: string;
  }) => void;
  clearAuth: () => void;
  setAccessToken: (accessToken: string | null) => void;
  hydrateAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  hydrated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  setAuth: ({ user, accessToken, refreshToken }) => {
    writeStoredTokens({ accessToken, refreshToken });
    set({ user, accessToken, refreshToken });
  },
  clearAuth: () => {
    clearStoredTokens();
    set({ user: null, accessToken: null, refreshToken: null });
  },
  setAccessToken: (accessToken) => {
    const refreshToken = get().refreshToken;
    if (accessToken && refreshToken) {
      writeStoredTokens({ accessToken, refreshToken });
    }
    set({ accessToken });
  },
  hydrateAuth: () => {
    const tokens = readStoredTokens();
    set({
      hydrated: true,
      accessToken: tokens?.accessToken ?? null,
      refreshToken: tokens?.refreshToken ?? null,
    });
  },
}));
