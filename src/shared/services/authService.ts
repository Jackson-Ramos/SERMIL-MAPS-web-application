import api from './api';

export interface Usuario {
  id: number;
  cond_id: number;
  nome: string;
  email: string;
  role: 'admin' | 'porteiro' | 'morador';
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const response = await api.post('/auth/login', { email, senha });
  return response.data;
}

export async function getMe(): Promise<Usuario> {
  const response = await api.get('/auth/me');
  return response.data;
}
