import { useEffect, useMemo, useState } from 'react';
import {
  PartyPopper,
  Home,
  Building2,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Users,
  AlertCircle,
  RotateCcw,
  User,
  Phone,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Badge, { BadgeVariant } from '../../../shared/components/Badge';
import EmptyState from '../../../shared/components/EmptyState';
import PageHeader from '../../../shared/components/PageHeader';
import Modal from '../../../shared/components/Modal';
import { Evento } from '../../../shared/types';
import {
  getEventosAdmin,
  aprovarEvento,
  rejeitarEvento,
  reabrirEvento,
} from '../../../shared/services/eventoAdminService';

const aprovVariant: Record<Evento['aprovacao_status'], BadgeVariant> = {
  pendente: 'warning',
  aprovado: 'success',
  rejeitado: 'danger',
};

const aprovLabel: Record<Evento['aprovacao_status'], string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function localResumo(e: Evento): string {
  if (e.local_tipo === 'residencia') return 'Na residência';
  return e.local_nome ? `Área comum · ${e.local_nome}` : 'Área comum';
}

type Filtro = 'todos' | 'pendente' | 'aprovado' | 'rejeitado';

export default function EventosAdminPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('pendente');
  const [selecionado, setSelecionado] = useState<Evento | null>(null);

  const [modalRejeitar, setModalRejeitar] = useState<Evento | null>(null);
  const [motivo, setMotivo] = useState('');
  const [acao, setAcao] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregar();
  }, [filtro]);

  const carregar = async () => {
    setLoading(true);
    try {
      const lista = await getEventosAdmin(
        filtro === 'todos' ? {} : { aprovacao_status: filtro },
      );
      setEventos(lista);
      setSelecionado((s) => (s ? lista.find((e) => e.id === s.id) ?? null : null));
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const contadores = useMemo(() => {
    return {
      pendente: eventos.filter((e) => e.aprovacao_status === 'pendente').length,
      aprovado: eventos.filter((e) => e.aprovacao_status === 'aprovado').length,
      rejeitado: eventos.filter((e) => e.aprovacao_status === 'rejeitado').length,
    };
  }, [eventos]);

  const notificarMudanca = () => {
    window.dispatchEvent(new CustomEvent('eventos:atualizado'));
  };

  const handleAprovar = async (e: Evento) => {
    setAcao(true);
    try {
      await aprovarEvento(e.id);
      toast.success('Evento aprovado');
      notificarMudanca();
      carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao aprovar');
    } finally {
      setAcao(false);
    }
  };

  const handleReabrir = async (e: Evento) => {
    setAcao(true);
    try {
      await reabrirEvento(e.id);
      toast.success('Evento devolvido para análise');
      notificarMudanca();
      carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao reabrir');
    } finally {
      setAcao(false);
    }
  };

  const abrirRejeicao = (e: Evento) => {
    setMotivo('');
    setErro('');
    setModalRejeitar(e);
  };

  const confirmarRejeicao = async () => {
    if (!modalRejeitar) return;
    setErro('');
    if (!motivo.trim()) return setErro('Informe o motivo da rejeição.');
    setAcao(true);
    try {
      await rejeitarEvento(modalRejeitar.id, motivo.trim());
      toast.success('Evento rejeitado');
      setModalRejeitar(null);
      notificarMudanca();
      carregar();
    } catch (err: any) {
      setErro(err.message || 'Erro ao rejeitar');
    } finally {
      setAcao(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Eventos dos Moradores"
        subtitle="Aprove ou rejeite eventos solicitados pelos moradores"
      />

      {/* Tabs / filtros */}
      <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
        {([
          { k: 'pendente',  label: 'Pendentes',  badge: contadores.pendente  },
          { k: 'aprovado',  label: 'Aprovados',  badge: contadores.aprovado  },
          { k: 'rejeitado', label: 'Rejeitados', badge: contadores.rejeitado },
          { k: 'todos',     label: 'Todos',      badge: null                  },
        ] as const).map((f) => (
          <button
            key={f.k}
            onClick={() => setFiltro(f.k)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
              filtro === f.k
                ? 'bg-white dark:bg-gray-700 text-[#0B4F3A] dark:text-[#28b88d] shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {f.label}
            {f.badge !== null && f.badge > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                {f.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Lista */}
        <Card className="!p-0 overflow-hidden lg:col-span-2">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PartyPopper size={13} className="text-gray-500" />
              <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wider">
                Eventos
              </h3>
            </div>
            <Badge variant="neutral">{eventos.length}</Badge>
          </div>

          {loading ? (
            <div className="p-6 text-center text-sm text-gray-500">Carregando...</div>
          ) : eventos.length === 0 ? (
            <EmptyState
              icon={<PartyPopper size={20} />}
              title={filtro === 'pendente' ? 'Nenhum pendente' : 'Sem eventos'}
              description={
                filtro === 'pendente'
                  ? 'Não há eventos aguardando aprovação.'
                  : 'Nenhum evento neste filtro.'
              }
            />
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[70vh] overflow-y-auto">
              {eventos.map((e) => {
                const isSel = selecionado?.id === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelecionado(e)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors ${
                      isSel
                        ? 'bg-[#0B4F3A]/[0.04] dark:bg-[#28b88d]/[0.06] border-l-2 border-[#0B4F3A] dark:border-[#28b88d]'
                        : 'border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        e.local_tipo === 'residencia'
                          ? 'bg-[#0B4F3A]/8 dark:bg-[#28b88d]/10 text-[#0B4F3A] dark:text-[#28b88d]'
                          : 'bg-amber-50 dark:bg-amber-900/15 text-amber-600 dark:text-amber-400'
                      }`}>
                        {e.local_tipo === 'residencia' ? <Home size={15} /> : <Building2 size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                            {e.titulo}
                          </p>
                          <Badge variant={aprovVariant[e.aprovacao_status]} dot>
                            {aprovLabel[e.aprovacao_status]}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {e.morador_nome} · Q.{e.quadra} L.{e.lote}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays size={10} />
                            {formatarData(e.data_inicio)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={10} />
                            {e.total_convidados ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Detalhe + ações */}
        <div className="lg:col-span-3">
          {!selecionado ? (
            <Card className="!p-0 overflow-hidden">
              <EmptyState
                icon={<PartyPopper size={20} />}
                title="Selecione um evento"
                description="Escolha um evento à esquerda para revisar e decidir."
              />
            </Card>
          ) : (
            <Card className="!p-0 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    selecionado.local_tipo === 'residencia'
                      ? 'bg-[#0B4F3A]/8 dark:bg-[#28b88d]/10 text-[#0B4F3A] dark:text-[#28b88d]'
                      : 'bg-amber-50 dark:bg-amber-900/15 text-amber-600 dark:text-amber-400'
                  }`}>
                    {selecionado.local_tipo === 'residencia' ? <Home size={20} /> : <Building2 size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-gray-900 dark:text-white">
                        {selecionado.titulo}
                      </h2>
                      <Badge variant={aprovVariant[selecionado.aprovacao_status]} dot>
                        {aprovLabel[selecionado.aprovacao_status]}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <Row icon={<User size={12} />} label="Solicitante" value={selecionado.morador_nome || '—'} />
                <Row
                  icon={<Home size={12} />}
                  label="Local"
                  value={`${localResumo(selecionado)} · Q.${selecionado.quadra} L.${selecionado.lote}`}
                />
                {selecionado.morador_ramal && (
                  <Row icon={<Phone size={12} />} label="Ramal" value={selecionado.morador_ramal} />
                )}
                <Row
                  icon={<CalendarDays size={12} />}
                  label="Início"
                  value={formatarData(selecionado.data_inicio)}
                />
                {selecionado.data_fim && (
                  <Row
                    icon={<CalendarDays size={12} />}
                    label="Término"
                    value={formatarData(selecionado.data_fim)}
                  />
                )}
                <Row
                  icon={<Users size={12} />}
                  label="Convidados"
                  value={String(selecionado.total_convidados ?? 0)}
                />
                {selecionado.observacoes && (
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1.5">
                      <FileText size={11} />
                      Observações do morador
                    </p>
                    <p className="text-[12px] text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {selecionado.observacoes}
                    </p>
                  </div>
                )}

                {/* Histórico de aprovação */}
                {selecionado.aprovacao_status !== 'pendente' && (
                  <div className={`p-3 rounded-xl border ${
                    selecionado.aprovacao_status === 'aprovado'
                      ? 'bg-green-50/70 dark:bg-green-900/10 border-green-100 dark:border-green-900/20'
                      : 'bg-red-50/70 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
                  }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
                      selecionado.aprovacao_status === 'aprovado'
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}>
                      {selecionado.aprovacao_status === 'aprovado' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {selecionado.aprovacao_status === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                      {selecionado.revisor_nome && <span>· por {selecionado.revisor_nome}</span>}
                      {selecionado.revisado_em && (
                        <span className="text-gray-400">· {formatarData(selecionado.revisado_em)}</span>
                      )}
                    </p>
                    {selecionado.motivo_rejeicao && (
                      <p className="text-[12px] text-red-800 dark:text-red-200 leading-relaxed">
                        <span className="font-semibold">Motivo: </span>
                        {selecionado.motivo_rejeicao}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="p-5 pt-0 flex gap-3 flex-wrap">
                {selecionado.aprovacao_status === 'pendente' && (
                  <>
                    <Button onClick={() => handleAprovar(selecionado)} loading={acao}>
                      <CheckCircle2 size={15} />
                      Aprovar
                    </Button>
                    <Button variant="danger" onClick={() => abrirRejeicao(selecionado)}>
                      <XCircle size={15} />
                      Rejeitar
                    </Button>
                  </>
                )}
                {selecionado.aprovacao_status !== 'pendente' && (
                  <Button variant="secondary" onClick={() => handleReabrir(selecionado)} loading={acao}>
                    <RotateCcw size={15} />
                    Reabrir análise
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de rejeição */}
      <Modal
        isOpen={!!modalRejeitar}
        onClose={() => setModalRejeitar(null)}
        title="Rejeitar evento"
        subtitle={modalRejeitar?.titulo}
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setModalRejeitar(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarRejeicao} loading={acao}>
              Rejeitar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Informe o motivo da rejeição. O morador verá esta justificativa.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Motivo
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Ex.: Salão de festas já reservado nesta data."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end">
              <span className="text-[10px] text-gray-400">{motivo.length}/500</span>
            </div>
          </div>
          {erro && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
              <AlertCircle size={15} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-[12px] font-semibold text-red-700 dark:text-red-300">{erro}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

interface RowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function Row({ icon, label, value }: RowProps) {
  return (
    <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-3 last:border-0">
      <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-[12px] font-bold text-gray-900 dark:text-white text-right">{value}</p>
    </div>
  );
}
