import {
  mockCondominio,
  mockConfiguracoes,
  mockQuadras,
  mockLotes,
  mockVisitas,
  mockQRCodes,
  mockMoradores,
  mockUsuarios,
} from '../data/mockData';

let visitasAtivas = [...mockVisitas];
let visitaIdCounter = 3;

let moradores = [...mockMoradores];
let moradorIdCounter = moradores.length + 1;

let usuarios = [...mockUsuarios];
let usuarioIdCounter = usuarios.length + 1;

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

  createQuadra: (data: any) => {
    return new Promise((resolve) => {
      const nova = { id: mockQuadras.length + 1, nome: data.nome, cond_id: data.cond_id };
      mockQuadras.push(nova);
      mockLotes[nova.id] = [];
      setTimeout(() => resolve(nova), 300);
    });
  },

  getLotes: (quadraId: number) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockLotes[quadraId] || []), 300);
    });
  },

  createLote: (data: any) => {
    return new Promise((resolve) => {
      const allIds = Object.values(mockLotes).flat().map((l) => l.id);
      const novo = {
        id: allIds.length > 0 ? Math.max(...allIds) + 1 : 1,
        numero: data.numero,
        quadra_id: data.quadra_id,
        nome_morador: data.nome_morador || null,
        ramal: data.ramal || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      };
      if (!mockLotes[data.quadra_id]) mockLotes[data.quadra_id] = [];
      mockLotes[data.quadra_id].push(novo);
      setTimeout(() => resolve(novo), 300);
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

  getMoradores: (condId: number) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...moradores]), 300);
    });
  },

  createMorador: (data: any) => {
    return new Promise((resolve) => {
      const lote = Object.values(mockLotes).flat().find((l) => l.id === data.lote_id);
      const quadra = mockQuadras.find((q) => q.id === lote?.quadra_id);
      const novo = {
        id: moradorIdCounter++,
        nome: data.nome,
        cpf: data.cpf,
        lote_id: data.lote_id,
        quadra: quadra?.nome || '',
        lote: lote?.numero || '',
        ramal: data.ramal,
        user_id: null,
        total_visitas: 0,
      };
      moradores.push(novo);
      setTimeout(() => resolve(novo), 300);
    });
  },

  updateMorador: (id: number, data: any) => {
    return new Promise((resolve) => {
      const index = moradores.findIndex((m) => m.id === id);
      if (index !== -1) {
        const lote = data.lote_id
          ? Object.values(mockLotes).flat().find((l) => l.id === data.lote_id)
          : null;
        const quadra = lote
          ? mockQuadras.find((q) => q.id === lote.quadra_id)
          : null;
        moradores[index] = {
          ...moradores[index],
          ...data,
          ...(quadra && { quadra: quadra.nome }),
          ...(lote && { lote: lote.numero }),
        };
        setTimeout(() => resolve(moradores[index]), 300);
      } else {
        setTimeout(() => resolve(null), 300);
      }
    });
  },

  deleteMorador: (id: number) => {
    return new Promise((resolve) => {
      moradores = moradores.filter((m) => m.id !== id);
      setTimeout(() => resolve(null), 300);
    });
  },

  getUsuarios: (condId: number) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...usuarios]), 300);
    });
  },

  createUsuario: (data: any) => {
    return new Promise((resolve) => {
      const novo = {
        id: usuarioIdCounter++,
        nome: data.nome,
        email: data.email,
        papel: data.papel,
        cond_id: data.cond_id,
        ativo: true,
        criado_em: new Date().toISOString(),
      };
      usuarios.push(novo);
      setTimeout(() => resolve(novo), 300);
    });
  },

  updateUsuario: (id: number, data: any) => {
    return new Promise((resolve) => {
      const index = usuarios.findIndex((u) => u.id === id);
      if (index !== -1) {
        const { senha, ...rest } = data;
        usuarios[index] = { ...usuarios[index], ...rest };
        setTimeout(() => resolve(usuarios[index]), 300);
      } else {
        setTimeout(() => resolve(null), 300);
      }
    });
  },

  toggleAtivoUsuario: (id: number) => {
    return new Promise((resolve) => {
      const index = usuarios.findIndex((u) => u.id === id);
      if (index !== -1) {
        usuarios[index] = { ...usuarios[index], ativo: !usuarios[index].ativo };
        setTimeout(() => resolve(usuarios[index]), 300);
      } else {
        setTimeout(() => resolve(null), 300);
      }
    });
  },

  deleteUsuario: (id: number) => {
    return new Promise((resolve) => {
      usuarios = usuarios.filter((u) => u.id !== id);
      setTimeout(() => resolve(null), 300);
    });
  },
};
