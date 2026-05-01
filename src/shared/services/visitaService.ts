import api, { USE_MOCK } from './api';
import { mockAPI } from './mockService';
import { Visita } from '../types';

export async function iniciarVisita(
  cpf: string,
  loteId: number,
  condId: number,
  rotaJson: any,
  quadra: string,
  lote: string,
  nomeVisitante?: string,
  pendente: boolean = false
): Promise<Visita> {
  try {
    const response = await api.post('/visita/iniciar', {
      cpf,
      lote_id: loteId,
      cond_id: condId,
      quadra,
      lote,
      nome_visitante: nomeVisitante ?? null,
      rota: rotaJson,
      pendente,
    });
    if (!response.data && USE_MOCK) {
      return await mockAPI.iniciarVisita(cpf, loteId, condId, rotaJson) as Visita;
    }
    return response.data;
  } catch (error) {
    if (USE_MOCK) {
      return await mockAPI.iniciarVisita(cpf, loteId, condId, rotaJson) as Visita;
    }
    throw error;
  }
}

// Confirma uma visita pré-registrada pelo porteiro: marca o horario_entrada
// real (momento do scan) e altera o status de "pendente" para "ativa".
// Endpoint público (não requer autenticação) — usado pelo visitante.
export async function confirmarVisita(
  visitaId: number,
  rotaJson?: any,
  appNavegacao?: string
): Promise<Visita> {
  const response = await api.post('/visita-publica/confirmar', {
    visita_id: visitaId,
    rota: rotaJson,
    app_navegacao: appNavegacao,
  });
  return response.data;
}

export async function encerrarVisita(visitaId: number): Promise<Visita> {
  try {
    const response = await api.patch('/visita/encerrar', { visita_id: visitaId });
    if (!response.data && USE_MOCK) {
      return await mockAPI.encerrarVisita(visitaId) as Visita;
    }
    return response.data;
  } catch (error) {
    if (USE_MOCK) {
      return await mockAPI.encerrarVisita(visitaId) as Visita;
    }
    throw error;
  }
}

export async function getVisitasAtivas(condId: number): Promise<Visita[]> {
  try {
    const response = await api.get(`/visitas/ativas?cond_id=${condId}`);
    if (!response.data && USE_MOCK) {
      return await mockAPI.getVisitasAtivas(condId) as Visita[];
    }
    return response.data;
  } catch (error) {
    if (USE_MOCK) {
      return await mockAPI.getVisitasAtivas(condId) as Visita[];
    }
    throw error;
  }
}

export async function getHistoricoVisitas(
  condId: number,
  filtros: Record<string, any> = {}
): Promise<Visita[]> {
  try {
    const params = new URLSearchParams({
      cond_id: String(condId),
      ...filtros,
    });

    const response = await api.get(`/visitas/historico?${params}`);
    if (!response.data && USE_MOCK) {
      return await mockAPI.getHistoricoVisitas(condId, filtros) as Visita[];
    }
    return response.data;
  } catch (error) {
    if (USE_MOCK) {
      return await mockAPI.getHistoricoVisitas(condId, filtros) as Visita[];
    }
    throw error;
  }
}
