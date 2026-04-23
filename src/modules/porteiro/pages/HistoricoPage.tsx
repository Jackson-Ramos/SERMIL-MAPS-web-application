import { useState } from 'react';
import { getHistoricoVisitas } from '../../../shared/services/visitaService';
import { Visita } from '../../../shared/types';
import Card from '../../../shared/components/Card';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import { formatarHora } from '../../../shared/utils/tempo';
import { mascararCPF } from '../../../shared/utils/cpf';

export default function HistoricoPage() {
  const [busca, setBusca] = useState('');
  const [tipoBusca, setTipoBusca] = useState<'cpf' | 'lote'>('cpf');
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [visitaSelecionada, setVisitaSelecionada] = useState<Visita | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  const handleBuscar = async () => {
    if (!busca) return;
    setBuscando(true);
    try {
      const condId = Number(import.meta.env.VITE_COND_ID) || 1;
      const filtros = tipoBusca === 'cpf' ? { cpf: busca } : { lote: busca };
      const dados = await getHistoricoVisitas(condId, filtros);
      setVisitas(dados);
      setVisitaSelecionada(null);
      setBuscaRealizada(true);
    } catch (error) {
      console.error('Erro ao buscar visitas:', error);
    } finally {
      setBuscando(false);
    }
  };

  const statusConfig = (status: string) => {
    if (status === 'ativa') return { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500 animate-pulse' };
    if (status === 'encerrada') return { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
    return { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Histórico de Visitas</h1>
        <p className="text-xs font-medium text-gray-500 mt-1">Consulta por CPF ou número de lote</p>
      </header>

      <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden">
        <div className="p-4 bg-white dark:bg-gray-900">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-full w-fit mb-4">
            {(['cpf', 'lote'] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setTipoBusca(tipo)}
                className={`px-5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
                  tipoBusca === tipo
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tipo === 'cpf' ? 'CPF' : 'Lote'}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <Input
                placeholder={tipoBusca === 'cpf' ? 'Digite o CPF...' : 'Digite o lote...'}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="!pl-10 !text-sm !py-2.5 !rounded-xl !border-gray-200 shadow-sm"
              />
            </div>
            <Button onClick={handleBuscar} disabled={buscando || !busca} className="!rounded-xl font-bold bg-[#0B4F3A] hover:bg-[#073627] text-white px-6 py-2.5 shadow-sm disabled:opacity-60">
              {buscando ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </div>
      </Card>

      {buscaRealizada && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden">
            <div className="py-2.5 px-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
              <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wide">Resultados</h3>
              <span className="text-[10px] font-bold text-gray-400">{visitas.length} registro(s)</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[50vh] overflow-y-auto bg-white dark:bg-gray-900">
              {visitas.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm font-medium">Nenhuma visita encontrada.</div>
              ) : visitas.map((visita) => {
                const st = statusConfig(visita.status);
                return (
                  <button
                    key={visita.id}
                    onClick={() => setVisitaSelecionada(visita)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${visitaSelecionada?.id === visita.id ? 'bg-green-50/50 border-l-2 border-[#0B4F3A]' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[12px] font-bold text-gray-900 dark:text-white font-mono">{mascararCPF(visita.cpf)}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Q.{visita.quadra} — L.{visita.lote} · {formatarHora(visita.horario_entrada)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${st.badge}`}>{visita.status}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden">
            <div className="py-2.5 px-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wide">Detalhes</h3>
            </div>
            <div className="p-5 bg-white dark:bg-gray-900 min-h-[200px]">
              {!visitaSelecionada ? (
                <div className="h-40 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  <p className="text-xs font-medium">Selecione um registro</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'CPF', value: mascararCPF(visitaSelecionada.cpf), mono: true },
                    { label: 'Destino', value: `Quadra ${visitaSelecionada.quadra} — Lote ${visitaSelecionada.lote}` },
                    { label: 'Entrada', value: formatarHora(visitaSelecionada.horario_entrada), mono: true },
                    { label: 'Saída', value: visitaSelecionada.horario_saida ? formatarHora(visitaSelecionada.horario_saida) : 'Ainda ativa' },
                    { label: 'Duração', value: visitaSelecionada.duracao_minutos ? `${visitaSelecionada.duracao_minutos} min` : '—' },
                    { label: 'App de Navegação', value: visitaSelecionada.app_navegacao },
                  ].map(({ label, value, mono }) => (
                    <div key={label} className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                      <p className={`text-[12px] font-bold text-gray-900 dark:text-white ${mono ? 'font-mono' : ''}`}>{value}</p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</p>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${statusConfig(visitaSelecionada.status).badge}`}>
                      {visitaSelecionada.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
