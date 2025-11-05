import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await AsyncStorage.multiSet([
      ['user', JSON.stringify(user)],
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
    ]);
    set({ user, isAuthenticated: true });
  },

  clearAuth: async () => {
    await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
    set({ user: null, isAuthenticated: false });
  },

  loadAuth: async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      set({ user: JSON.parse(userData), isAuthenticated: true });
    }
  },
}));
