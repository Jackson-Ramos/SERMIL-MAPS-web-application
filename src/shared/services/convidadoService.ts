import api from './api';
import { Convidado } from '../types';

// Operações em convidados individuais (criação e listagem agora ficam em
// eventoService, escopadas por evento).

export async function atualizarConvidado(
  id: number,
  payload: Partial<{
    nome: string;
    cpf: string;
    telefone: string;
    observacoes: string;
    link_status: Convidado['link_status'];
  }>,
): Promise<Convidado> {
  const r = await api.patch(`/morador/convidados/${id}`, payload);
  return r.data;
}

export async function excluirConvidado(id: number): Promise<void> {
  await api.delete(`/morador/convidados/${id}`);
}
