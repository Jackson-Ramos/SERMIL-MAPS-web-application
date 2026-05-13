export interface Condominio {
  id: number;
  nome: string;
  cidade: string;
  ramal_portaria: string;
}

export interface Configuracoes {
  tempo_maximo_visita: number;
  mapa_interno_ativo: boolean;
  google_maps_ativo: boolean;
  waze_ativo: boolean;
  ramal_flutuante_ativo: boolean;
  expiracao_automatica_ativa: boolean;
}

export interface Quadra {
  id: number;
  nome: string;
  cond_id: number;
}

export interface Lote {
  id: number;
  numero: string;
  quadra_id: number;
  nome_morador: string | null;
  ramal: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Morador {
  id: number;
  nome: string;
  cpf: string;
  lote_id: number;
  quadra: string;
  lote: string;
  ramal: string;
  user_id: number | null;
  total_visitas: number;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  papel: 'admin' | 'porteiro' | 'morador';
  cond_id: number;
  ativo: boolean;
  criado_em: string;
}

export interface Visita {
  id: number;
  cpf: string;
  nome_visitante: string | null;
  lote_id: number;
  cond_id: number;
  quadra: string;
  lote: string;
  horario_entrada: string | null;
  horario_saida: string | null;
  duracao_minutos: number | null;
  app_navegacao: string;
  status: 'pendente' | 'ativa' | 'encerrada' | 'expirada';
  rota: any;
  observacoes: string | null;
}

export interface Evento {
  id: number;
  morador_id: number;
  cond_id: number;
  titulo: string;
  local_tipo: 'residencia' | 'area_comum';
  local_nome: string | null;
  data_inicio: string;
  data_fim: string | null;
  observacoes: string | null;
  status: 'agendado' | 'realizado' | 'cancelado';
  aprovacao_status: 'pendente' | 'aprovado' | 'rejeitado';
  motivo_rejeicao: string | null;
  revisado_por: number | null;
  revisado_em: string | null;
  morador_ciente: boolean;
  criado_em: string;
  total_convidados?: number;
  // campos extras na visão admin
  morador_nome?: string;
  morador_ramal?: string | null;
  quadra?: string;
  lote?: string;
  revisor_nome?: string | null;
}

export interface Convidado {
  id: number;
  morador_id: number;
  cond_id: number;
  evento_id: number | null;
  nome: string | null;
  cpf: string | null;
  telefone: string | null;
  observacoes: string | null;
  origem: 'manual' | 'link';
  link_token: string | null;
  link_status: 'pendente' | 'preenchido' | 'desabilitado' | null;
  preenchido_em: string | null;
  criado_em: string;
}

export interface Agendamento {
  id: number;
  morador_id: number;
  cond_id: number;
  lote_id: number;
  convidado_id: number | null;
  nome_visitante: string;
  cpf: string | null;
  data_prevista: string;
  observacoes: string | null;
  status: 'agendado' | 'realizada' | 'cancelada' | 'expirada';
  visita_id: number | null;
  criado_em: string;
  quadra?: string;
  lote?: string;
}

export interface ConviteInfo {
  id: number;
  link_status: 'pendente' | 'preenchido' | 'desabilitado';
  nome: string | null;
  preenchido_em: string | null;
  morador_nome: string;
  quadra_nome: string;
  lote_numero: string;
  condominio_nome: string;
  evento_id: number | null;
  evento_titulo: string | null;
  evento_local_tipo: 'residencia' | 'area_comum' | null;
  evento_local_nome: string | null;
  evento_data_inicio: string | null;
  evento_data_fim: string | null;
  evento_observacoes: string | null;
}

export interface QRCode {
  id: number;
  cond_id: number;
  nome_portao: string;
  url: string;
  ativo: boolean;
  criado_em: string;
  expira_em?: string | null;
  uso_unico?: boolean;
}
