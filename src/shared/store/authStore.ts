import { create } from 'zustand';

interface AuthState {
  token: string | null;
  role: 'admin' | 'porteiro' | null;
  setAuth: (token: string, role: 'admin' | 'porteiro') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('sermil_token'),
  role: localStorage.getItem('sermil_role') as 'admin' | 'porteiro' | null,
  setAuth: (token, role) => {
    localStorage.setItem('sermil_token', token);
    localStorage.setItem('sermil_role', role);
    set({ token, role });
  },
  logout: () => {
    localStorage.removeItem('sermil_token');
    localStorage.removeItem('sermil_role');
    set({ token: null, role: null });
  }
}));
