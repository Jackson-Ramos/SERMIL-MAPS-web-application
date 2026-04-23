import api, { USE_MOCK } from './api';
import { mockAPI } from './mockService';
import { Condominio, Configuracoes } from '../types';

export async function getCondominio(condId: number): Promise<Condominio> {
  try {
    const response = await api.get(`/condominios/${condId}`);
    if (!response.data && USE_MOCK) {
      return await mockAPI.getCondominio(condId) as Condominio;
    }
    return response.data;
  } catch (error) {
    if (USE_MOCK) {
      return await mockAPI.getCondominio(condId) as Condominio;
    }
    throw error;
  }
}

export async function updateCondominio(condId: number, data: Partial<Condominio>): Promise<Condominio> {
  try {
    const response = await api.put(`/condominios/${condId}`, data);
    if (!response.data && USE_MOCK) {
      return await mockAPI.updateCondominio(condId, data) as Condominio;
    }
    return response.data;
  } catch (error) {
    if (USE_MOCK) {
      return await mockAPI.updateCondominio(condId, data) as Condominio;
    }
    throw error;
  }
}

export async function getConfiguracoes(condId: number): Promise<Configuracoes> {
  try {
    const response = await api.get(`/condominios/${condId}/configuracoes`);
    if (!response.data && USE_MOCK) {
      return await mockAPI.getConfiguracoes(condId) as Configuracoes;
    }
    return response.data;
  } catch (error) {
    if (USE_MOCK) {
      return await mockAPI.getConfiguracoes(condId) as Configuracoes;
    }
    throw error;
  }
}

export async function updateConfiguracoes(condId: number, data: Partial<Configuracoes>): Promise<Configuracoes> {
  try {
    const response = await api.put(`/condominios/${condId}/configuracoes`, data);
    if (!response.data && USE_MOCK) {
      return await mockAPI.updateConfiguracoes(condId, data) as Configuracoes;
    }
    return response.data;
  } catch (error) {
    if (USE_MOCK) {
      return await mockAPI.updateConfiguracoes(condId, data) as Configuracoes;
    }
    throw error;
  }
}
