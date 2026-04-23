import api, { USE_MOCK } from './api';
import { mockAPI } from './mockService';
import { Quadra } from '../types';

export async function getQuadras(condId: number): Promise<Quadra[]> {
  try {
    const response = await api.get(`/quadras?cond_id=${condId}`);
    if (!response.data && USE_MOCK) {
      return await mockAPI.getQuadras(condId) as Quadra[];
    }
    return response.data;
  } catch (error) {
    if (USE_MOCK) {
      return await mockAPI.getQuadras(condId) as Quadra[];
    }
    throw error;
  }
}

export async function createQuadra(data: Partial<Quadra>): Promise<Quadra> {
  const response = await api.post('/quadras', data);
  return response.data;
}

export async function updateQuadra(id: number, data: Partial<Quadra>): Promise<Quadra> {
  const response = await api.put(`/quadras/${id}`, data);
  return response.data;
}
