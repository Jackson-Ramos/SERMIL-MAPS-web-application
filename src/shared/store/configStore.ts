import { create } from 'zustand';
import { getConfiguracoes, updateConfiguracoes } from '../services/condominioService';
import { getConfiguracoesPublico } from '../services/publicService';
import { Configuracoes } from '../types';

interface ConfigState {
  config: Configuracoes | null;
  loading: boolean;
  error: string | null;
  fetchConfig: (condId: number) => Promise<void>;
  updateConfig: (condId: number, data: Partial<Configuracoes>) => Promise<Configuracoes>;
}

const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  loading: false,
  error: null,

  // Tenta o endpoint autenticado primeiro (admin/porteiro);
  // se não houver token ou falhar, cai no endpoint público (visitante).
  fetchConfig: async (condId: number) => {
    set({ loading: true, error: null });
    try {
      const hasToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('sermil_token');
      const config = hasToken
        ? await getConfiguracoes(condId)
        : await getConfiguracoesPublico(condId);
      set({ config, loading: false });
    } catch (error: any) {
      try {
        const config = await getConfiguracoesPublico(condId);
        set({ config, loading: false });
      } catch (fallbackError: any) {
        set({ error: fallbackError.message, loading: false });
      }
    }
  },

  updateConfig: async (condId: number, data: Partial<Configuracoes>) => {
    set({ loading: true, error: null });
    try {
      const config = await updateConfiguracoes(condId, data);
      set({ config, loading: false });
      return config;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));

export default useConfigStore;
