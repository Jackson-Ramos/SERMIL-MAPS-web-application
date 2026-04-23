import { create } from 'zustand';
import { getVisitasAtivas } from '../services/visitaService';
import { Visita } from '../types';

interface VisitasState {
  visitasAtivas: Visita[];
  loading: boolean;
  error: string | null;
  pollingInterval: NodeJS.Timeout | null;
  fetchVisitasAtivas: (condId: number) => Promise<void>;
  startPolling: (condId: number, intervalMs?: number) => void;
  stopPolling: () => void;
}

const useVisitasStore = create<VisitasState>((set, get) => ({
  visitasAtivas: [],
  loading: false,
  error: null,
  pollingInterval: null,

  fetchVisitasAtivas: async (condId: number) => {
    set({ loading: true, error: null });
    try {
      const visitas = await getVisitasAtivas(condId);
      set({ visitasAtivas: visitas, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  startPolling: (condId: number, intervalMs = 30000) => {
    const { pollingInterval, stopPolling } = get();

    if (pollingInterval) {
      stopPolling();
    }

    get().fetchVisitasAtivas(condId);

    const interval = setInterval(() => {
      get().fetchVisitasAtivas(condId);
    }, intervalMs);

    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },
}));

export default useVisitasStore;
