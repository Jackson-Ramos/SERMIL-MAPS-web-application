import api from './api';
import { Agendamento } from '../types';

export async function getAgendamentos(): Promise<Agendamento[]> {
  const r = await api.get('/morador/agendamentos');
  return r.data ?? [];
}

export async function criarAgendamento(payload: {
  nome_visitante: string;
  cpf?: string;
  data_prevista: string;
  observacoes?: string;
  convidado_id?: number;
}): Promise<Agendamento> {
  const r = await api.post('/morador/agendamentos', payload);
  return r.data;
}

export async function atualizarAgendamento(
  id: number,
  payload: Partial<{
    nome_visitante: string;
    cpf: string;
    data_prevista: string;
    observacoes: string;
    status: Agendamento['status'];
  }>,
): Promise<Agendamento> {
  const r = await api.patch(`/morador/agendamentos/${id}`, payload);
  return r.data;
}

export async function excluirAgendamento(id: number): Promise<void> {
  await api.delete(`/morador/agendamentos/${id}`);
}

export async function getHistoricoMorador(limit = 100) {
  const r = await api.get(`/morador/historico?limit=${limit}`);
  return r.data ?? [];
}
