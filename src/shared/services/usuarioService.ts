import api, { USE_MOCK } from './api';
import { mockAPI } from './mockService';
import { Usuario } from '../types';

// O backend usa "role"; o restante do app usa "papel". Traduzimos aqui.
type ApiUsuario = Omit<Usuario, 'papel'> & { role: Usuario['papel'] };

function fromApi(u: ApiUsuario): Usuario {
  const { role, ...rest } = u;
  return { ...rest, papel: role };
}

function toApi(input: Partial<{
  nome: string;
  email: string;
  senha: string;
  papel: Usuario['papel'];
  ativo: boolean;
  cond_id: number;
}>): Record<string, unknown> {
  const { papel, ...rest } = input;
  const out: Record<string, unknown> = { ...rest };
  if (papel !== undefined) out.role = papel;
  return out;
}

export async function getUsuarios(condId: number): Promise<Usuario[]> {
  try {
    const response = await api.get<ApiUsuario[]>(`/usuarios?cond_id=${condId}`);
    if (!response.data && USE_MOCK) {
      return await mockAPI.getUsuarios(condId) as Usuario[];
    }
    return (response.data || []).map(fromApi);
  } catch {
    if (USE_MOCK) {
      return await mockAPI.getUsuarios(condId) as Usuario[];
    }
    throw new Error('Erro ao carregar usuários');
  }
}

export async function createUsuario(data: {
  nome: string;
  email: string;
  senha: string;
  papel: Usuario['papel'];
  cond_id: number;
}): Promise<Usuario> {
  try {
    const response = await api.post<ApiUsuario>('/usuarios', toApi(data));
    if (!response.data && USE_MOCK) {
      return await mockAPI.createUsuario(data) as Usuario;
    }
    return fromApi(response.data);
  } catch {
    if (USE_MOCK) {
      return await mockAPI.createUsuario(data) as Usuario;
    }
    throw new Error('Erro ao criar usuário');
  }
}

export async function updateUsuario(id: number, data: Partial<{
  nome: string;
  email: string;
  senha: string;
  papel: Usuario['papel'];
  ativo: boolean;
}>): Promise<Usuario> {
  try {
    const response = await api.put<ApiUsuario>(`/usuarios/${id}`, toApi(data));
    if (!response.data && USE_MOCK) {
      return await mockAPI.updateUsuario(id, data) as Usuario;
    }
    return fromApi(response.data);
  } catch {
    if (USE_MOCK) {
      return await mockAPI.updateUsuario(id, data) as Usuario;
    }
    throw new Error('Erro ao atualizar usuário');
  }
}

export async function toggleAtivoUsuario(id: number): Promise<Usuario> {
  try {
    const response = await api.patch<ApiUsuario>(`/usuarios/${id}/toggle-ativo`);
    if (!response.data && USE_MOCK) {
      return await mockAPI.toggleAtivoUsuario(id) as Usuario;
    }
    return fromApi(response.data);
  } catch {
    if (USE_MOCK) {
      return await mockAPI.toggleAtivoUsuario(id) as Usuario;
    }
    throw new Error('Erro ao alterar status do usuário');
  }
}

export async function deleteUsuario(id: number): Promise<void> {
  try {
    const response = await api.delete(`/usuarios/${id}`);
    if (response.data === null && USE_MOCK) {
      await mockAPI.deleteUsuario(id);
      return;
    }
  } catch {
    if (USE_MOCK) {
      await mockAPI.deleteUsuario(id);
      return;
    }
    throw new Error('Erro ao remover usuário');
  }
}
