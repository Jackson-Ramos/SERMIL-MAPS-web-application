import { useEffect, useState } from 'react';
import useVisitasStore from '../../../shared/store/visitasStore';
import { encerrarVisita } from '../../../shared/services/visitaService';
import Card from '../../../shared/components/Card';
import Loading from '../../../shared/components/Loading';
import Button from '../../../shared/components/Button';
import { calcularPermanencia, formatarHora } from '../../../shared/utils/tempo';
import { ocultarCPF } from '../../../shared/utils/cpf';
import Modal from '../../../shared/components/Modal';
import Input from '../../../shared/components/Input';
import { toast } from 'sonner';

export default function PainelPage() {
  const { visitasAtivas, loading, startPolling, stopPolling, fetchVisitasAtivas } = useVisitasStore();
  const [observacao, setObservacao] = useState<{ [key: number]: string }>({});
  const [visitaParaEncerrar, setVisitaParaEncerrar] = useState<number | null>(null);
  const [visitaParaObs, setVisitaParaObs] = useState<number | null>(null);
  const [obsInput, setObsInput] = useState('');

  useEffect(() => {
    const condId = Number(import.meta.env.VITE_COND_ID) || 1;
    startPolling(condId, 15000);
    return () => { stopPolling(); };
  }, []);

  const handleConfirmarEncerrar = async () => {
    if (!visitaParaEncerrar) return;
    try {
      await encerrarVisita(visitaParaEncerrar);
      const condId = Number(import.meta.env.VITE_COND_ID) || 1;
      fetchVisitasAtivas(condId);
      toast.success('Visita encerrada com sucesso!');
    } catch (error) {
      console.error('Erro ao encerrar visita:', error);
      toast.error('Erro ao encerrar visita.');
    } finally {
      setVisitaParaEncerrar(null);
    }
  };

  const handleSalvarObs = () => {
    if (!visitaParaObs || !obsInput.trim()) return;
    setObservacao({ ...observacao, [visitaParaObs]: obsInput });
    toast.success('Observação salva com sucesso!');
    setVisitaParaObs(null);
    setObsInput('');
  };

  const getStatusInfo = (horarioEntrada: string, tempoMaximo: number = 60) => {
    const entrada = new Date(horarioEntrada);
    const agora = new Date();
    const minutos = Math.floor((agora.getTime() - entrada.getTime()) / 60000);

    if (minutos > tempoMaximo) return { border: 'border-red-400', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700', label: 'Expirada' };
    if (minutos > 30) return { border: 'border-amber-400', dot: 'bg-amber-500 animate-pulse', badge: 'bg-amber-100 text-amber-700', label: 'Atenção' };
    return { border: 'border-green-400', dot: 'bg-green-500 animate-pulse', badge: 'bg-green-100 text-green-700', label: 'Normal' };
  };

  const visitasAtivasOnly = visitasAtivas.filter((v) => v.status === 'ativa');

  if (loading && visitasAtivasOnly.length === 0) return <Loading />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header com contador */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-gradient-to-br from-[#0B4F3A] to-[#073627] text-white p-5 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-green-300/80">Visitantes Ativos</p>
            <p className="text-5xl font-black mt-1 tabular-nums">{visitasAtivasOnly.length}</p>
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex flex-col justify-center shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Atualização</p>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">A cada 15 segundos</p>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mt-2"></span>
        </div>
      </div>

      {/* Lista de Visitas */}
      <div className="space-y-3">
        {visitasAtivasOnly.length === 0 ? (
          <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="py-12 text-center text-gray-400 dark:text-gray-500 font-medium text-sm">
              Nenhuma visita ativa no momento.
            </div>
          </Card>
        ) : (
          visitasAtivasOnly.map((visita) => {
            const status = getStatusInfo(visita.horario_entrada);
            return (
              <Card
                key={visita.id}
                className={`!rounded-2xl border-2 ${status.border} shadow-sm !p-0 overflow-hidden`}
              >
                <div className="p-4 flex justify-between items-start gap-4 bg-white dark:bg-gray-900">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${status.dot}`}></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${status.badge}`}>
                          {status.label}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          #{visita.id}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        <div>
                          <p className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">CPF</p>
                          <p className="text-[12px] font-bold text-gray-900 dark:text-white font-mono">{ocultarCPF(visita.cpf)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Destino</p>
                          <p className="text-[12px] font-bold text-gray-900 dark:text-white">Q.{visita.quadra} — L.{visita.lote}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Entrada</p>
                          <p className="text-[12px] font-mono text-gray-700 dark:text-gray-300">{formatarHora(visita.horario_entrada)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Permanência</p>
                          <p className="text-[12px] font-bold text-gray-900 dark:text-white">{calcularPermanencia(visita.horario_entrada)}</p>
                        </div>
                      </div>
                      {(visita.observacoes || observacao[visita.id]) && (
                        <p className="text-[11px] text-gray-500 mt-2 italic">
                          📝 {observacao[visita.id] || visita.observacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => setVisitaParaEncerrar(visita.id)}
                      className="rounded-xl text-[11px] font-bold tracking-wide bg-red-500 hover:bg-red-600 text-white px-4 py-2 shadow-sm transition-colors"
                    >
                      Encerrar
                    </button>
                    <button
                      onClick={() => { setVisitaParaObs(visita.id); setObsInput(observacao[visita.id] || ''); }}
                      className="text-[11px] font-bold text-[#0B4F3A] dark:text-green-400 hover:underline text-center"
                    >
                      + Observação
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal Encerrar */}
      {visitaParaEncerrar !== null && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 w-[380px] shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Encerrar Visita?</h3>
              <p className="text-sm text-gray-500 mt-1">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setVisitaParaEncerrar(null)} className="flex-1 !rounded-xl py-2.5 border border-gray-200">Cancelar</Button>
              <Button onClick={handleConfirmarEncerrar} className="flex-1 !rounded-xl py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold shadow">Confirmar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Observação */}
      {visitaParaObs !== null && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 w-[420px] shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-50 dark:border-gray-800">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Adicionar Observação</h3>
              <button onClick={() => setVisitaParaObs(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-1 mb-5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Observação</label>
              <Input value={obsInput} onChange={(e) => setObsInput(e.target.value)} placeholder="Digite os detalhes..." className="!text-sm !py-2.5 !rounded-xl !border-gray-200 shadow-sm" />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setVisitaParaObs(null)} className="flex-1 !rounded-xl py-2.5 border border-gray-200">Cancelar</Button>
              <Button onClick={handleSalvarObs} className="flex-1 !rounded-xl py-2.5 bg-[#0B4F3A] hover:bg-[#073627] text-white font-bold shadow">Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
