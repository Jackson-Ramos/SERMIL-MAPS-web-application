import axios from 'axios';
import { Condominio, Configuracoes, Quadra, Lote, Visita } from '../types';

// Cliente axios separado para o fluxo do visitante: sem token e sem o
// interceptor de 401 que redireciona para /login.
const publicApi = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/publica',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Erro na requisição';
    return Promise.reject(new Error(message));
  },
);

export async function getCondominioPublico(condId: number): Promise<Condominio> {
  const { data } = await publicApi.get(`/condominios/${condId}`);
  return data;
}

export async function getConfiguracoesPublico(condId: number): Promise<Configuracoes> {
  const { data } = await publicApi.get(`/condominios/${condId}/configuracoes`);
  return data;
}

export async function getQuadrasPublico(condId: number): Promise<Quadra[]> {
  const { data } = await publicApi.get(`/quadras`, { params: { cond_id: condId } });
  return data;
}

export async function getLotesPublico(quadraId: number): Promise<Lote[]> {
  const { data } = await publicApi.get(`/lotes`, { params: { quadra_id: quadraId } });
  return data;
}

export async function confirmarVisitaPublico(
  visitaId: number,
  rotaJson?: any,
  appNavegacao?: string,
): Promise<Visita> {
  const { data } = await publicApi.post(`/visita/confirmar`, {
    visita_id: visitaId,
    rota: rotaJson,
    app_navegacao: appNavegacao,
  });
  return data;
}
