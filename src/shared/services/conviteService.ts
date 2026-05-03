import api from './api';
import { ConviteInfo } from '../types';

// Endpoints públicos (sem autenticação) — usados pelo convidado ao abrir o
// link enviado pelo morador.

export async function getConvite(token: string): Promise<ConviteInfo> {
  const r = await api.get(`/publica/convite/${token}`);
  return r.data;
}

export async function preencherConvite(
  token: string,
  payload: { nome: string; cpf?: string; telefone?: string },
): Promise<{ id: number; nome: string; link_status: string; preenchido_em: string }> {
  const r = await api.post(`/publica/convite/${token}`, payload);
  return r.data;
}
