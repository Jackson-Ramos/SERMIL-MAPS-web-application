import api from './api';
import { Evento } from '../types';

export async function getEventosAdmin(filtros: { aprovacao_status?: string } = {}): Promise<Evento[]> {
  const params = new URLSearchParams();
  if (filtros.aprovacao_status) params.set('aprovacao_status', filtros.aprovacao_status);
  const r = await api.get(`/eventos${params.toString() ? `?${params}` : ''}`);
  return r.data ?? [];
}

export async function getEventoAdmin(id: number): Promise<Evento> {
  const r = await api.get(`/eventos/${id}`);
  return r.data;
}

export async function aprovarEvento(id: number): Promise<Evento> {
  const r = await api.patch(`/eventos/${id}/aprovacao`, { aprovacao_status: 'aprovado' });
  return r.data;
}

export async function rejeitarEvento(id: number, motivo: string): Promise<Evento> {
  const r = await api.patch(`/eventos/${id}/aprovacao`, {
    aprovacao_status: 'rejeitado',
    motivo_rejeicao: motivo,
  });
  return r.data;
}

export async function reabrirEvento(id: number): Promise<Evento> {
  const r = await api.patch(`/eventos/${id}/aprovacao`, { aprovacao_status: 'pendente' });
  return r.data;
}

export interface ContadoresAdmin {
  pendente: number;
  aprovado: number;
  rejeitado: number;
}

export async function getContadoresAdmin(): Promise<ContadoresAdmin> {
  const r = await api.get('/eventos/contadores');
  return r.data;
}
