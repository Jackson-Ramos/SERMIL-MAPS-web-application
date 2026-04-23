import {
  mockCondominio,
  mockConfiguracoes,
  mockQuadras,
  mockLotes,
  mockVisitas,
  mockQRCodes,
  mockMoradores,
} from '../data/mockData';

let visitasAtivas = [...mockVisitas];
let visitaIdCounter = 3;

export const mockAPI = {
  getCondominio: (condId: number) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockCondominio), 300);
    });
  },

  updateCondominio: (condId: number, data: any) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockCondominio, ...data }), 300);
    });
  },

  getConfiguracoes: (condId: number) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockConfiguracoes), 300);
    });
  },

  updateConfiguracoes: (condId: number, data: any) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockConfiguracoes, ...data }), 300);
    });
  },

  getQuadras: (condId: number) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockQuadras), 300);
    });
  },

  getLotes: (quadraId: number) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockLotes[quadraId] || []), 300);
    });
  },

  updateLote: (id: number, data: any) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ id, ...data }), 300);
    });
  },

  iniciarVisita: (cpf: string, loteId: number, condId: number, rota: any) => {
    return new Promise((resolve) => {
      const lote = Object.values(mockLotes)
        .flat()
        .find((l) => l.id === loteId);

      const quadra = mockQuadras.find((q) => q.id === lote?.quadra_id);

      const novaVisita = {
        id: visitaIdCounter++,
        cpf,
        lote_id: loteId,
        cond_id: condId,
        quadra: quadra?.nome || '',
        lote: lote?.numero || '',
        horario_entrada: new Date().toISOString(),
        horario_saida: null,
        duracao_minutos: null,
        app_navegacao: rota.tipo || 'interno',
        status: 'ativa' as const,
        rota,
        observacoes: null,
      };

      visitasAtivas.push(novaVisita);

      setTimeout(() => resolve(novaVisita), 300);
    });
  },

  encerrarVisita: (visitaId: number) => {
    return new Promise((resolve) => {
      const index = visitasAtivas.findIndex((v) => v.id === visitaId);

      if (index !== -1) {
        const visita = visitasAtivas[index];
        const entrada = new Date(visita.horario_entrada);
        const saida = new Date();
        const duracao = Math.floor((saida.getTime() - entrada.getTime()) / 60000);

        const visitaEncerrada = {
          ...visita,
          horario_saida: saida.toISOString(),
          duracao_minutos: duracao,
          status: 'encerrada' as const,
        };

        visitasAtivas[index] = visitaEncerrada;

        setTimeout(() => resolve(visitaEncerrada), 300);
      } else {
        setTimeout(() => resolve(null), 300);
      }
    });
  },

  getVisitasAtivas: (condId: number) => {
    return new Promise((resolve) => {
      const ativas = visitasAtivas.filter((v) => v.status === 'ativa');
      setTimeout(() => resolve(ativas), 300);
    });
  },

  getHistoricoVisitas: (condId: number, filtros: any) => {
    return new Promise((resolve) => {
      let resultado = [...visitasAtivas];

      if (filtros.cpf) {
        resultado = resultado.filter((v) => v.cpf.includes(filtros.cpf));
      }

      if (filtros.lote) {
        resultado = resultado.filter((v) => v.lote === filtros.lote);
      }

      if (filtros.status) {
        resultado = resultado.filter((v) => v.status === filtros.status);
      }

      setTimeout(() => resolve(resultado), 300);
    });
  },

  getQrCodes: (condId: number) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockQRCodes), 300);
    });
  },

  gerarQrCode: (condId: number, nomePortao: string, expiracaoHoras?: number, usoUnico?: boolean) => {
    return new Promise((resolve) => {
      const expirationDate = expiracaoHoras 
        ? new Date(Date.now() + expiracaoHoras * 3600 * 1000).toISOString()
        : null;
      
      const hash = Math.random().toString(36).substring(2, 10);
      const urlBase = `http://localhost:5173/visitante?cond=${condId}&gate=${mockQRCodes.length + 1}`;
      const tokenQuery = (expiracaoHoras || usoUnico) ? `&t=${hash}` : '';

      const novoQR = {
        id: mockQRCodes.length + 1,
        cond_id: condId,
        nome_portao: nomePortao,
        url: urlBase + tokenQuery,
        ativo: true,
        criado_em: new Date().toISOString(),
        expira_em: expirationDate,
        uso_unico: usoUnico || false,
      };

      mockQRCodes.push(novoQR);
      setTimeout(() => resolve(novoQR), 300);
    });
  },

  revogarQrCode: (qrId: number) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(null), 300);
    });
  },
};
