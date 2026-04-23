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
  quadra: string;
  lote: string;
  ramal: string;
  total_visitas: number;
}

export interface Visita {
  id: number;
  cpf: string;
  lote_id: number;
  cond_id: number;
  quadra: string;
  lote: string;
  horario_entrada: string;
  horario_saida: string | null;
  duracao_minutos: number | null;
  app_navegacao: string;
  status: 'ativa' | 'encerrada' | 'expirada';
  rota: any;
  observacoes: string | null;
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
