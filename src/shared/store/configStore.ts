import { create } from 'zustand';
import { getConfiguracoes, updateConfiguracoes } from '../services/condominioService';
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

  fetchConfig: async (condId: number) => {
    set({ loading: true, error: null });
    try {
      const config = await getConfiguracoes(condId);
      set({ config, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
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
