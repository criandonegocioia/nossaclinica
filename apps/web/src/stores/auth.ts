import { create } from 'zustand';
import api from '@/lib/api';
import type { User } from '@clinica/shared';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('user', JSON.stringify(data.user));

    set({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');

    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initialize: () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userJson = localStorage.getItem('user');

      if (token && userJson) {
        try {
          const user = JSON.parse(userJson);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          localStorage.clear();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error('Failed to access localStorage during initialization:', err);
      set({ isLoading: false, isAuthenticated: false });
    }
  },
}));
