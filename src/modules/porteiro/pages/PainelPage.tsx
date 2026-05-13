import { useEffect, useState } from 'react';
import useVisitasStore from '../../../shared/store/visitasStore';
import { encerrarVisita } from '../../../shared/services/visitaService';
import Card from '../../../shared/components/Card';
import Loading from '../../../shared/components/Loading';
import Button from '../../../shared/components/Button';
import Badge, { BadgeVariant } from '../../../shared/components/Badge';
import EmptyState from '../../../shared/components/EmptyState';
import Modal from '../../../shared/components/Modal';
import Input from '../../../shared/components/Input';
import PageHeader from '../../../shared/components/PageHeader';
import { calcularPermanencia, formatarHora } from '../../../shared/utils/tempo';
import { ocultarCPF } from '../../../shared/utils/cpf';
import { toast } from 'sonner';
import {
  Users,
  AlertTriangle,
  StickyNote,
  RefreshCw,
  MapPin,
  Clock,
  Hash,
  Timer,
  LogOut,
  MessageSquarePlus,
} from 'lucide-react';

interface StatusInfo {
  variant: BadgeVariant;
  label: string;
  ring: string;
  bar: string;
}

export default function PainelPage() {
  const { visitasAtivas, loading, startPolling, stopPolling, fetchVisitasAtivas } = useVisitasStore();
  const [observacao, setObservacao] = useState<{ [key: number]: string }>({});
  const [visitaParaEncerrar, setVisitaParaEncerrar] = useState<number | null>(null);
  const [visitaParaObs, setVisitaParaObs] = useState<number | null>(null);
  const [obsInput, setObsInput] = useState('');
  const [encerrando, setEncerrando] = useState(false);

  useEffect(() => {
    const condId = Number(import.meta.env.VITE_COND_ID) || 1;
    startPolling(condId, 15000);
    return () => { stopPolling(); };
  }, []);

  const handleConfirmarEncerrar = async () => {
    if (!visitaParaEncerrar) return;
    setEncerrando(true);
    try {
      await encerrarVisita(visitaParaEncerrar);
      const condId = Number(import.meta.env.VITE_COND_ID) || 1;
      fetchVisitasAtivas(condId);
      toast.success('Visita encerrada com sucesso!');
    } catch (error) {
      console.error('Erro ao encerrar visita:', error);
      toast.error('Erro ao encerrar visita.');
    } finally {
      setEncerrando(false);
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

  const getStatusInfo = (horarioEntrada: string | null, tempoMaximo: number = 60): StatusInfo => {
    const entrada = new Date(horarioEntrada || Date.now());
    const agora = new Date();
    const minutos = Math.floor((agora.getTime() - entrada.getTime()) / 60000);

    if (minutos > tempoMaximo) {
      return { variant: 'expirada', label: 'Expirada', ring: 'ring-red-200 dark:ring-red-900/40', bar: 'bg-red-500' };
    }
    if (minutos > 30) {
      return { variant: 'warning', label: 'Atenção', ring: 'ring-amber-200 dark:ring-amber-900/40', bar: 'bg-amber-500' };
    }
    return { variant: 'ativa', label: 'Normal', ring: 'ring-green-200 dark:ring-green-900/40', bar: 'bg-green-500' };
  };

  const visitasAtivasOnly = visitasAtivas.filter((v) => v.status === 'ativa');

  if (loading && visitasAtivasOnly.length === 0) return <Loading />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Painel de Portaria"
        subtitle="Visitantes ativos no condomínio em tempo real"
      />

      {/* Hero metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Visitor count card */}
        <Card variant="elevated" className="md:col-span-2 !p-0 overflow-hidden bg-gradient-to-br from-[#0B4F3A] via-[#0a3f2f] to-[#073627] !border-0 shadow-lg shadow-[#0B4F3A]/20 relative">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-[#28b88d]/10 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between p-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#28b88d]">
                Visitantes Ativos
              </p>
              <p className="text-5xl font-black tabular-nums text-white mt-1 leading-none">
                {visitasAtivasOnly.length}
              </p>
              <p className="text-[11px] font-medium text-white/60 mt-2">
                {visitasAtivasOnly.length === 1
                  ? 'pessoa dentro do condomínio agora'
                  : 'pessoas dentro do condomínio agora'}
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-sm">
              <Users size={28} className="text-[#28b88d]" />
            </div>
          </div>
        </Card>

        {/* Sync card */}
        <Card variant="default" className="!p-5 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Sincronização
            </p>
            <RefreshCw size={14} className="text-[#0B4F3A] dark:text-[#28b88d] animate-[spin_8s_linear_infinite]" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white mt-2">A cada 15 segundos</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              Conectado em tempo real
            </p>
          </div>
        </Card>
      </div>

      {/* Visit list */}
      {visitasAtivasOnly.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={22} />}
            title="Nenhuma visita ativa"
            description="Quando um visitante for registrado, ele aparecerá aqui automaticamente."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {visitasAtivasOnly.map((visita) => {
            const status = getStatusInfo(visita.horario_entrada);
            const obs = observacao[visita.id] || visita.observacoes;
            return (
              <Card
                key={visita.id}
                className={`!p-0 overflow-hidden ring-1 ${status.ring}`}
              >
                <div className="flex items-stretch">
                  {/* Side accent bar */}
                  <div className={`w-1 ${status.bar} flex-shrink-0`} />

                  {/* Main content */}
                  <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={status.variant} dot>
                          {status.label}
                        </Badge>
                        <Badge variant="neutral" className="!font-mono">
                          <Hash size={9} />#{visita.id}
                        </Badge>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2">
                        <InfoCell
                          icon={<Hash size={11} />}
                          label="CPF"
                          value={ocultarCPF(visita.cpf)}
                          mono
                        />
                        <InfoCell
                          icon={<MapPin size={11} />}
                          label="Destino"
                          value={`Q.${visita.quadra} — L.${visita.lote}`}
                        />
                        <InfoCell
                          icon={<Clock size={11} />}
                          label="Entrada"
                          value={formatarHora(visita.horario_entrada)}
                          mono
                        />
                        <InfoCell
                          icon={<Timer size={11} />}
                          label="Permanência"
                          value={calcularPermanencia(visita.horario_entrada)}
                        />
                      </div>

                      {/* Observation */}
                      {obs && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50/70 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                          <StickyNote size={12} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-800 dark:text-amber-200 italic leading-relaxed">
                            {obs}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 sm:w-[140px] flex-shrink-0">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setVisitaParaEncerrar(visita.id)}
                        className="flex-1 sm:flex-none"
                      >
                        <LogOut size={13} />
                        Encerrar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setVisitaParaObs(visita.id);
                          setObsInput(observacao[visita.id] || visita.observacoes || '');
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        <MessageSquarePlus size={13} />
                        Observação
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Encerrar Modal */}
      <Modal
        isOpen={visitaParaEncerrar !== null}
        onClose={() => setVisitaParaEncerrar(null)}
        title="Encerrar visita?"
        subtitle="Esta ação não pode ser desfeita."
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={handleConfirmarEncerrar}
              disabled={encerrando}
              className="flex-1"
            >
              {encerrando ? 'Encerrando...' : 'Confirmar'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setVisitaParaEncerrar(null)}
              disabled={encerrando}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-3">
            <AlertTriangle size={26} className="text-red-600 dark:text-red-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs">
            O horário de saída da visita será registrado no momento da confirmação.
          </p>
        </div>
      </Modal>

      {/* Observation Modal */}
      <Modal
        isOpen={visitaParaObs !== null}
        onClose={() => setVisitaParaObs(null)}
        title="Adicionar Observação"
        subtitle="Detalhes adicionais sobre a visita"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button onClick={handleSalvarObs} disabled={!obsInput.trim()} className="flex-1">
              Salvar
            </Button>
            <Button variant="secondary" onClick={() => setVisitaParaObs(null)} className="flex-1">
              Cancelar
            </Button>
          </div>
        }
      >
        <Input
          label="Observação"
          value={obsInput}
          onChange={(e) => setObsInput(e.target.value)}
          placeholder="Ex: visitante chegou de bicicleta..."
        />
      </Modal>
    </div>
  );
}

interface InfoCellProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}

function InfoCell({ icon, label, value, mono }: InfoCellProps) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 mb-0.5">
        {icon}
        <p className="text-[9px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p
        className={`text-[12px] font-bold text-gray-900 dark:text-white truncate ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}
