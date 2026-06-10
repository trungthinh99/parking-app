import { create } from "zustand";

import { getAccessToken, getUserId, saveAuthTokens, clearAuthTokens } from "@/src/lib/auth-storage";

interface AuthState {
  /** Whether the initial token check has completed */
  isHydrated: boolean;
  /** Whether user is currently authenticated */
  isAuthenticated: boolean;
  /** Logged-in user ID (from SecureStore) */
  userId: string | null;
}

interface AuthActions {
  /** Load auth state from SecureStore on app start */
  hydrate: () => Promise<void>;
  /** Set auth state after successful login */
  setAuthenticated: (params: {
    accessToken: string;
    refreshToken?: string;
    userId: string;
  }) => Promise<void>;
  /** Clear auth state and tokens (logout or forced expiry) */
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // Initial state
  isHydrated: false,
  isAuthenticated: false,
  userId: null,

  hydrate: async () => {
    const [token, userId] = await Promise.all([getAccessToken(), getUserId()]);
    set({
      isHydrated: true,
      isAuthenticated: !!token,
      userId,
    });
  },

  setAuthenticated: async ({ accessToken, refreshToken, userId }) => {
    await saveAuthTokens({ accessToken, refreshToken, userId });
    set({
      isAuthenticated: true,
      userId,
    });
  },

  logout: async () => {
    await clearAuthTokens();
    set({
      isAuthenticated: false,
      userId: null,
    });
  },
}));
