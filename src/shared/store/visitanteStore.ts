import { create } from 'zustand';

interface VisitanteState {
  condId: number | null;
  gate: string | null;
  cpf: string | null;
  quadraId: number | null;
  quadraNome: string | null;
  loteId: number | null;
  loteNumero: string | null;
  loteMorador: string | null;
  loteRamal: string | null;
  loteLat: number | null;
  loteLon: number | null;
  visitaId: number | null;
  horarioEntrada: string | null;
  setCondGate: (condId: number, gate: string) => void;
  setCpf: (cpf: string) => void;
  setQuadra: (id: number, nome: string) => void;
  setLote: (id: number, numero: string, morador: string | null, ramal: string | null, lat: number | null, lon: number | null) => void;
  setVisita: (id: number, horario: string) => void;
  clear: () => void;
}

export const useVisitanteStore = create<VisitanteState>((set) => ({
  condId: null,
  gate: null,
  cpf: null,
  quadraId: null,
  quadraNome: null,
  loteId: null,
  loteNumero: null,
  loteMorador: null,
  loteRamal: null,
  loteLat: null,
  loteLon: null,
  visitaId: null,
  horarioEntrada: null,
  setCondGate: (condId, gate) => set({ condId, gate }),
  setCpf: (cpf) => set({ cpf }),
  setQuadra: (id, nome) => set({ quadraId: id, quadraNome: nome }),
  setLote: (id, numero, morador, ramal, lat, lon) => set({
    loteId: id,
    loteNumero: numero,
    loteMorador: morador,
    loteRamal: ramal,
    loteLat: lat,
    loteLon: lon
  }),
  setVisita: (id, horario) => set({ visitaId: id, horarioEntrada: horario }),
  clear: () => set({
    condId: null,
    gate: null,
    cpf: null,
    quadraId: null,
    quadraNome: null,
    loteId: null,
    loteNumero: null,
    loteMorador: null,
    loteRamal: null,
    loteLat: null,
    loteLon: null,
    visitaId: null,
    horarioEntrada: null,
  })
}));
