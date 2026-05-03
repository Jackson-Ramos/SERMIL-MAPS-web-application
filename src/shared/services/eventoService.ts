import api from './api';
import { Evento, Convidado } from '../types';

export async function getEventos(): Promise<Evento[]> {
  const r = await api.get('/morador/eventos');
  return r.data ?? [];
}

export async function getEvento(id: number): Promise<Evento> {
  const r = await api.get(`/morador/eventos/${id}`);
  return r.data;
}

export async function criarEvento(payload: {
  titulo: string;
  local_tipo: 'residencia' | 'area_comum';
  local_nome?: string;
  data_inicio: string;
  data_fim?: string;
  observacoes?: string;
}): Promise<Evento> {
  const r = await api.post('/morador/eventos', payload);
  return r.data;
}

export async function atualizarEvento(
  id: number,
  payload: Partial<{
    titulo: string;
    local_tipo: 'residencia' | 'area_comum';
    local_nome: string;
    data_inicio: string;
    data_fim: string;
    observacoes: string;
    status: Evento['status'];
  }>,
): Promise<Evento> {
  const r = await api.patch(`/morador/eventos/${id}`, payload);
  return r.data;
}

export async function excluirEvento(id: number): Promise<void> {
  await api.delete(`/morador/eventos/${id}`);
}

export async function getConvidadosDoEvento(eventoId: number): Promise<Convidado[]> {
  const r = await api.get(`/morador/eventos/${eventoId}/convidados`);
  return r.data ?? [];
}

export async function criarConvidadoDoEvento(
  eventoId: number,
  payload: { nome: string; cpf?: string; telefone?: string; observacoes?: string },
): Promise<Convidado> {
  const r = await api.post(`/morador/eventos/${eventoId}/convidados`, payload);
  return r.data;
}

export async function gerarLinkConviteDoEvento(
  eventoId: number,
  observacoes?: string,
): Promise<Convidado> {
  const r = await api.post(`/morador/eventos/${eventoId}/convidados/link`, { observacoes });
  return r.data;
}

export interface ContadoresMorador {
  nao_lidos: number;
  pendentes: number;
  novos_aprovados: number;
  novos_rejeitados: number;
}

export async function getContadoresMorador(): Promise<ContadoresMorador> {
  const r = await api.get('/morador/eventos/contadores');
  return r.data;
}

export async function marcarEventoCiente(id: number): Promise<void> {
  await api.post(`/morador/eventos/${id}/ciente`);
}
