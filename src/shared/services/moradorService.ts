import api, { USE_MOCK } from './api';
import { mockAPI } from './mockService';
import { Morador } from '../types';

export async function getMoradores(condId: number): Promise<Morador[]> {
  try {
    const response = await api.get(`/moradores?cond_id=${condId}`);
    if (!response.data && USE_MOCK) {
      return await mockAPI.getMoradores(condId) as Morador[];
    }
    return response.data;
  } catch {
    if (USE_MOCK) {
      return await mockAPI.getMoradores(condId) as Morador[];
    }
    throw new Error('Erro ao carregar moradores');
  }
}

export async function createMorador(data: {
  nome: string;
  cpf: string;
  lote_id: number;
  ramal: string;
  cond_id: number;
}): Promise<Morador> {
  try {
    const response = await api.post('/moradores', data);
    if (!response.data && USE_MOCK) {
      return await mockAPI.createMorador(data) as Morador;
    }
    return response.data;
  } catch {
    if (USE_MOCK) {
      return await mockAPI.createMorador(data) as Morador;
    }
    throw new Error('Erro ao cadastrar morador');
  }
}

export async function updateMorador(id: number, data: Partial<{
  nome: string;
  cpf: string;
  lote_id: number;
  ramal: string;
}>): Promise<Morador> {
  try {
    const response = await api.put(`/moradores/${id}`, data);
    if (!response.data && USE_MOCK) {
      return await mockAPI.updateMorador(id, data) as Morador;
    }
    return response.data;
  } catch {
    if (USE_MOCK) {
      return await mockAPI.updateMorador(id, data) as Morador;
    }
    throw new Error('Erro ao atualizar morador');
  }
}

export async function deleteMorador(id: number): Promise<void> {
  try {
    const response = await api.delete(`/moradores/${id}`);
    if (response.data === null && USE_MOCK) {
      await mockAPI.deleteMorador(id);
      return;
    }
  } catch {
    if (USE_MOCK) {
      await mockAPI.deleteMorador(id);
      return;
    }
    throw new Error('Erro ao remover morador');
  }
}
