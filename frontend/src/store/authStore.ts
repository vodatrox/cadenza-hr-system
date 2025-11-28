import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Client } from '@/types';

interface AuthState {
  user: User | null;
  currentClient: Client | null;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: User | null) => void;
  setTokens: (access: string, refresh: string) => void;
  setCurrentClient: (client: Client | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      currentClient: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,

      setUser: (user) => {
        console.log('[AuthStore] setUser called:', user?.email);
        set({ user });
        if (typeof window !== 'undefined') {
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
          } else {
            localStorage.removeItem('user');
          }
        }
      },

      setTokens: (access, refresh) => {
        console.log('[AuthStore] setTokens called');
        set({ accessToken: access, refreshToken: refresh });
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
        }
      },

      setCurrentClient: (client) => {
        console.log('[AuthStore] setCurrentClient called:', client?.name);
        set({ currentClient: client });
        if (typeof window !== 'undefined') {
          if (client) {
            localStorage.setItem('current_client_id', client.id.toString());
            localStorage.setItem('current_client', JSON.stringify(client));
          } else {
            localStorage.removeItem('current_client_id');
            localStorage.removeItem('current_client');
          }
        }
      },

      logout: () => {
        console.log('[AuthStore] logout called');
        set({
          user: null,
          currentClient: null,
          accessToken: null,
          refreshToken: null,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('current_client_id');
          localStorage.removeItem('current_client');
        }
      },

      isAuthenticated: () => {
        const state = get();
        const isAuth = !!(state.user && state.accessToken);
        console.log('[AuthStore] isAuthenticated called:', isAuth);
        return isAuth;
      },

      setHasHydrated: (state) => {
        console.log('[AuthStore] setHasHydrated called:', state);
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        console.log('[AuthStore] Storage initialization, window exists:', typeof window !== 'undefined');
        // Only use localStorage on client side
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // Return a dummy storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      onRehydrateStorage: () => {
        console.log('[AuthStore] Rehydration starting...');
        return (state?: AuthState, error?: unknown) => {
          if (error) {
            console.error('[AuthStore] Rehydration error:', error);
          } else {
            console.log('[AuthStore] Rehydration complete:', {
              hasUser: !!state?.user,
              hasToken: !!state?.accessToken
            });
            state?.setHasHydrated(true);
          }
        };
      },
    }
  )
);
