import api, { USE_MOCK } from './api';
import { mockAPI } from './mockService';
import { Lote } from '../types';

export async function getLotes(quadraId: number): Promise<Lote[]> {
  try {
    const response = await api.get(`/lotes?quadra_id=${quadraId}`);
    if (!response.data && USE_MOCK) {
      return await mockAPI.getLotes(quadraId) as Lote[];
    }
    return response.data;
  } catch (error) {
    if (USE_MOCK) {
      return await mockAPI.getLotes(quadraId) as Lote[];
    }
    throw error;
  }
}

export async function createLote(data: Partial<Lote>): Promise<Lote> {
  const response = await api.post('/lotes', data);
  return response.data;
}

export async function updateLote(id: number, data: Partial<Lote>): Promise<Lote> {
  try {
    const response = await api.put(`/lotes/${id}`, data);
    if (!response.data && USE_MOCK) {
      return await mockAPI.updateLote(id, data) as Lote;
    }
    return response.data;
  } catch (error) {
    if (USE_MOCK) {
      return await mockAPI.updateLote(id, data) as Lote;
    }
    throw error;
  }
}

export async function importLotesCSV(condId: number, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('cond_id', String(condId));

  const response = await api.post('/lotes/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
