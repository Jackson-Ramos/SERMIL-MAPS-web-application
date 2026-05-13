import { create } from 'zustand';
import type { Usuario } from '../services/authService';

interface AuthState {
  token: string | null;
  role: 'admin' | 'porteiro' | 'morador' | null;
  usuario: Usuario | null;
  setAuth: (token: string, usuario: Usuario) => void;
  logout: () => void;
}

function loadUsuario(): Usuario | null {
  const raw = localStorage.getItem('sermil_usuario');
  if (!raw) return null;
  try { return JSON.parse(raw) as Usuario; } catch { return null; }
}

const stored = loadUsuario();

export const useAuthStore = create<AuthState>((set) => ({
  token:   localStorage.getItem('sermil_token'),
  role:    (localStorage.getItem('sermil_role') as AuthState['role']) ?? stored?.role ?? null,
  usuario: stored,
  setAuth: (token, usuario) => {
    localStorage.setItem('sermil_token',   token);
    localStorage.setItem('sermil_role',    usuario.role);
    localStorage.setItem('sermil_usuario', JSON.stringify(usuario));
    set({ token, role: usuario.role, usuario });
  },
  logout: () => {
    localStorage.removeItem('sermil_token');
    localStorage.removeItem('sermil_role');
    localStorage.removeItem('sermil_usuario');
    set({ token: null, role: null, usuario: null });
  },
}));
