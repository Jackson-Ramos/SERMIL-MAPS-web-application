import { useEffect, useMemo, useState } from 'react';
import {
  PartyPopper,
  Plus,
  Trash2,
  Home,
  Building2,
  CalendarDays,
  AlertCircle,
  Users,
  Link as LinkIcon,
  CheckCircle2,
  User,
  IdCard,
  Phone,
  FileText,
  Copy,
  ChevronRight,
  Lock,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Card from '../../../shared/components/Card';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import Badge, { BadgeVariant } from '../../../shared/components/Badge';
import EmptyState from '../../../shared/components/EmptyState';
import PageHeader from '../../../shared/components/PageHeader';
import Modal from '../../../shared/components/Modal';
import { Convidado, Evento } from '../../../shared/types';
import {
  getEventos,
  criarEvento,
  excluirEvento,
  atualizarEvento,
  getConvidadosDoEvento,
  criarConvidadoDoEvento,
  gerarLinkConviteDoEvento,
  marcarEventoCiente,
} from '../../../shared/services/eventoService';
import { excluirConvidado } from '../../../shared/services/convidadoService';
import { mascararCPF } from '../../../shared/utils/cpf';

const eventoStatusVariant: Record<Evento['status'], BadgeVariant> = {
  agendado: 'warning',
  realizado: 'success',
  cancelado: 'neutral',
};

const eventoStatusLabel: Record<Evento['status'], string> = {
  agendado: 'Agendado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
};

const aprovVariant: Record<Evento['aprovacao_status'], BadgeVariant> = {
  pendente: 'warning',
  aprovado: 'success',
  rejeitado: 'danger',
};

const aprovLabel: Record<Evento['aprovacao_status'], string> = {
  pendente: 'Aguardando aprovação',
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

function convidadoStatusInfo(c: Convidado): { variant: BadgeVariant; label: string } {
  if (c.origem === 'manual') return { variant: 'success', label: 'Manual' };
  if (c.link_status === 'preenchido') return { variant: 'success', label: 'Preenchido' };
  if (c.link_status === 'desabilitado') return { variant: 'neutral', label: 'Desabilitado' };
  return { variant: 'warning', label: 'Aguardando' };
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionado, setSelecionado] = useState<Evento | null>(null);

  const [modalNovo, setModalNovo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // form de evento
  const [titulo, setTitulo] = useState('');
  const [localTipo, setLocalTipo] = useState<'residencia' | 'area_comum'>('residencia');
  const [localNome, setLocalNome] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [obs, setObs] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    setLoading(true);
    try {
      const lista = await getEventos();
      setEventos(lista);
      setSelecionado((s) => (s ? lista.find((e) => e.id === s.id) ?? null : null));
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const selecionar = async (e: Evento) => {
    setSelecionado(e);
    if (!e.morador_ciente) {
      try {
        await marcarEventoCiente(e.id);
        if (e.aprovacao_status === 'aprovado') {
          toast.success(`"${e.titulo}" foi aprovado pela administração!`);
        } else if (e.aprovacao_status === 'rejeitado') {
          toast.error(`"${e.titulo}" foi rejeitado pela administração.`);
        }
        setEventos((prev) =>
          prev.map((ev) => (ev.id === e.id ? { ...ev, morador_ciente: true } : ev)),
        );
        window.dispatchEvent(new CustomEvent('eventos:atualizado'));
      } catch { /* silencioso */ }
    }
  };

  const abrirNovo = () => {
    setTitulo('');
    setLocalTipo('residencia');
    setLocalNome('');
    setDataInicio('');
    setDataFim('');
    setObs('');
    setErro('');
    setModalNovo(true);
  };

  const handleCriar = async () => {
    setErro('');
    if (!titulo.trim()) return setErro('Informe o título do evento.');
    if (!dataInicio) return setErro('Informe a data e hora de início.');
    if (localTipo === 'area_comum' && !localNome.trim()) {
      return setErro('Informe a área comum.');
    }
    setSalvando(true);
    try {
      const novo = await criarEvento({
        titulo: titulo.trim(),
        local_tipo: localTipo,
        local_nome: localTipo === 'area_comum' ? localNome.trim() : undefined,
        data_inicio: dataInicio,
        data_fim: dataFim || undefined,
        observacoes: obs.trim() || undefined,
      });
      toast.success('Evento criado! Aguardando aprovação da administração.');
      setModalNovo(false);
      await carregar();
      setSelecionado(novo);
      window.dispatchEvent(new CustomEvent('eventos:atualizado'));
    } catch (e: any) {
      setErro(e.message || 'Erro ao criar evento');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (e: Evento) => {
    if (!confirm(`Excluir "${e.titulo}"? Os convidados deste evento também serão removidos.`)) return;
    try {
      await excluirEvento(e.id);
      toast.success('Evento excluído');
      if (selecionado?.id === e.id) setSelecionado(null);
      carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir');
    }
  };

  const handleCancelar = async (e: Evento) => {
    if (!confirm('Cancelar este evento?')) return;
    try {
      await atualizarEvento(e.id, { status: 'cancelado' });
      toast.success('Evento cancelado');
      carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cancelar');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Meus Eventos"
        subtitle="Crie eventos e gerencie a lista de convidados de cada um"
        action={
          <Button onClick={abrirNovo}>
            <Plus size={15} />
            Novo evento
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Lista de eventos */}
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
              title="Sem eventos"
              description="Crie seu primeiro evento para começar a montar a lista de convidados."
              action={
                <Button onClick={abrirNovo}>
                  <Plus size={14} />
                  Novo evento
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[70vh] overflow-y-auto">
              {eventos.map((e) => {
                const isSel = selecionado?.id === e.id;
                const naoLido = !e.morador_ciente;
                return (
                  <button
                    key={e.id}
                    onClick={() => selecionar(e)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors ${
                      isSel
                        ? 'bg-[#0B4F3A]/[0.04] dark:bg-[#28b88d]/[0.06] border-l-2 border-[#0B4F3A] dark:border-[#28b88d]'
                        : naoLido
                        ? 'bg-amber-50/40 dark:bg-amber-900/10 border-l-2 border-amber-400 dark:border-amber-500'
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
                          {naoLido && (
                            <span
                              className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 animate-pulse"
                              title="Atualização não lida"
                            />
                          )}
                          <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                            {e.titulo}
                          </p>
                          <Badge variant={aprovVariant[e.aprovacao_status]} dot>
                            {aprovLabel[e.aprovacao_status]}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {localResumo(e)}
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
                      <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Painel do evento selecionado */}
        <div className="lg:col-span-3">
          {selecionado ? (
            <EventoDetalhe
              key={selecionado.id}
              evento={selecionado}
              onChange={carregar}
              onExcluir={() => handleExcluir(selecionado)}
              onCancelar={() => handleCancelar(selecionado)}
            />
          ) : (
            <Card className="!p-0 overflow-hidden">
              <EmptyState
                icon={<PartyPopper size={20} />}
                title="Selecione um evento"
                description="Escolha um evento à esquerda para gerenciar seus convidados."
              />
            </Card>
          )}
        </div>
      </div>

      {/* Modal: novo evento */}
      <Modal
        isOpen={modalNovo}
        onClose={() => setModalNovo(false)}
        title="Novo evento"
        subtitle="Aniversário, churrasco, reunião..."
        size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setModalNovo(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriar} loading={salvando}>
              Criar evento
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Título do evento"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Aniversário do João"
            startIcon={<PartyPopper size={15} />}
            maxLength={120}
            required
          />

          {/* Local */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Onde será o evento?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalTipo('residencia')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                  localTipo === 'residencia'
                    ? 'border-[#0B4F3A] dark:border-[#28b88d] bg-[#0B4F3A]/5 dark:bg-[#28b88d]/10 text-[#0B4F3A] dark:text-[#28b88d]'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <Home size={15} />
                Na residência
              </button>
              <button
                type="button"
                onClick={() => setLocalTipo('area_comum')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                  localTipo === 'area_comum'
                    ? 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/15 text-amber-700 dark:text-amber-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <Building2 size={15} />
                Área comum
              </button>
            </div>
          </div>

          {localTipo === 'area_comum' && (
            <Input
              label="Qual área comum?"
              value={localNome}
              onChange={(e) => setLocalNome(e.target.value)}
              placeholder="Ex.: Salão de Festas, Churrasqueira, Quadra..."
              startIcon={<Building2 size={15} />}
              maxLength={120}
              required
            />
          )}

          {/* Datas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Início
              </label>
              <input
                type="datetime-local"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0B4F3A] dark:focus:ring-[#28b88d]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Término (opcional)
              </label>
              <input
                type="datetime-local"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0B4F3A] dark:focus:ring-[#28b88d]"
              />
            </div>
          </div>

          <Input
            label="Observações (opcional)"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Detalhes do evento..."
            startIcon={<FileText size={15} />}
            maxLength={300}
          />

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

// ─── Painel de detalhe de um evento ─────────────────────────────────────────

interface EventoDetalheProps {
  evento: Evento;
  onChange: () => void;
  onExcluir: () => void;
  onCancelar: () => void;
}

function EventoDetalhe({ evento, onChange, onExcluir, onCancelar }: EventoDetalheProps) {
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalManual, setModalManual] = useState(false);
  const [modalLink, setModalLink] = useState(false);
  const [linkGerado, setLinkGerado] = useState<{ url: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [tel, setTel] = useState('');
  const [obs, setObs] = useState('');
  const [erro, setErro] = useState('');

  const linkResumo = useMemo(() => {
    return convidados.filter((c) => c.origem === 'link');
  }, [convidados]);

  useEffect(() => {
    carregar();
  }, [evento.id]);

  const carregar = async () => {
    setLoading(true);
    try {
      setConvidados(await getConvidadosDoEvento(evento.id));
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar convidados');
    } finally {
      setLoading(false);
    }
  };

  const abrirManual = () => {
    setNome('');
    setCpf('');
    setTel('');
    setObs('');
    setErro('');
    setModalManual(true);
  };

  const salvarManual = async () => {
    setErro('');
    if (!nome.trim()) return setErro('Informe o nome.');
    setSalvando(true);
    try {
      await criarConvidadoDoEvento(evento.id, {
        nome: nome.trim(),
        cpf: cpf.replace(/\D/g, '') || undefined,
        telefone: tel.trim() || undefined,
        observacoes: obs.trim() || undefined,
      });
      toast.success('Convidado adicionado!');
      setModalManual(false);
      carregar();
      onChange();
    } catch (e: any) {
      setErro(e.message || 'Erro ao adicionar');
    } finally {
      setSalvando(false);
    }
  };

  const gerarLink = async () => {
    setSalvando(true);
    try {
      const c = await gerarLinkConviteDoEvento(evento.id);
      const url = `${window.location.origin}/convite/${c.link_token}`;
      setLinkGerado({ url });
      setModalLink(true);
      carregar();
      onChange();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar link');
    } finally {
      setSalvando(false);
    }
  };

  const copiarLink = async () => {
    if (!linkGerado) return;
    try {
      await navigator.clipboard.writeText(linkGerado.url);
      toast.success('Link copiado!');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const compartilhar = async () => {
    if (!linkGerado) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convite para ${evento.titulo}`,
          text: `Você está convidado(a) para "${evento.titulo}". Preencha seu nome:`,
          url: linkGerado.url,
        });
      } catch {
        /* cancelado */
      }
    } else {
      copiarLink();
    }
  };

  const removerConvidado = async (c: Convidado) => {
    if (!confirm(`Remover ${c.nome || 'este convite'}?`)) return;
    try {
      await excluirConvidado(c.id);
      toast.success('Removido');
      carregar();
      onChange();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao remover');
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho do evento */}
      <Card className="!p-0 overflow-hidden">
        <div className="p-5 flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            evento.local_tipo === 'residencia'
              ? 'bg-[#0B4F3A]/8 dark:bg-[#28b88d]/10 text-[#0B4F3A] dark:text-[#28b88d]'
              : 'bg-amber-50 dark:bg-amber-900/15 text-amber-600 dark:text-amber-400'
          }`}>
            {evento.local_tipo === 'residencia' ? <Home size={20} /> : <Building2 size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {evento.titulo}
              </h2>
              <Badge variant={aprovVariant[evento.aprovacao_status]} dot>
                {aprovLabel[evento.aprovacao_status]}
              </Badge>
              <Badge variant={eventoStatusVariant[evento.status]}>
                {eventoStatusLabel[evento.status]}
              </Badge>
            </div>
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-gray-500 dark:text-gray-400">
              <p className="flex items-center gap-1.5">
                {evento.local_tipo === 'residencia' ? <Home size={11} /> : <Building2 size={11} />}
                {localResumo(evento)}
              </p>
              <p className="flex items-center gap-1.5">
                <CalendarDays size={11} />
                {formatarData(evento.data_inicio)}
              </p>
              {evento.data_fim && (
                <p className="flex items-center gap-1.5 sm:col-span-2">
                  <CalendarDays size={11} />
                  Termina em {formatarData(evento.data_fim)}
                </p>
              )}
              {evento.observacoes && (
                <p className="italic sm:col-span-2 mt-1">{evento.observacoes}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            {evento.status === 'agendado' && (
              <button
                onClick={onCancelar}
                title="Cancelar evento"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
              >
                <XCircle size={15} />
              </button>
            )}
            <button
              onClick={onExcluir}
              title="Excluir evento"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Aviso de aprovação */}
        {evento.aprovacao_status === 'pendente' && (
          <div className="mx-5 mb-5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-0.5 flex items-center gap-1.5">
              <AlertCircle size={11} />
              Aguardando aprovação da administração
            </p>
            <p className="text-[12px] text-amber-800 dark:text-amber-200 leading-relaxed">
              Você ainda pode adicionar convidados, mas o evento só será confirmado após análise.
            </p>
          </div>
        )}
        {evento.aprovacao_status === 'rejeitado' && evento.motivo_rejeicao && (
          <div className="mx-5 mb-5 p-3 rounded-xl bg-red-50/70 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 mb-1 flex items-center gap-1.5">
              <XCircle size={11} />
              Evento rejeitado
              {evento.revisado_em && (
                <span className="text-gray-400 normal-case font-normal">
                  · {formatarData(evento.revisado_em)}
                </span>
              )}
            </p>
            <p className="text-[12px] text-red-800 dark:text-red-200 leading-relaxed">
              <span className="font-semibold">Motivo: </span>
              {evento.motivo_rejeicao}
            </p>
          </div>
        )}
      </Card>

      {/* Lista de convidados */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Users size={13} className="text-gray-500" />
            <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wider">
              Convidados
            </h3>
            <Badge variant="neutral">{convidados.length}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={gerarLink} loading={salvando && !modalManual}>
              <LinkIcon size={13} />
              Gerar link
            </Button>
            <Button size="sm" onClick={abrirManual}>
              <Plus size={13} />
              Adicionar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-sm text-gray-500">Carregando...</div>
        ) : convidados.length === 0 ? (
          <EmptyState
            icon={<Users size={20} />}
            title="Lista vazia"
            description="Adicione convidados manualmente ou envie um link para que eles mesmos se cadastrem."
          />
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[50vh] overflow-y-auto">
            {convidados.map((c) => {
              const info = convidadoStatusInfo(c);
              const isLinkPendente = c.origem === 'link' && c.link_status === 'pendente';
              const isLinkPreenchido = c.origem === 'link' && c.link_status === 'preenchido';
              const linkUrl = c.link_token
                ? `${window.location.origin}/convite/${c.link_token}`
                : null;
              return (
                <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isLinkPendente
                      ? 'bg-amber-50 dark:bg-amber-900/15 text-amber-600 dark:text-amber-400'
                      : isLinkPreenchido
                      ? 'bg-green-50 dark:bg-green-900/15 text-green-600 dark:text-green-400'
                      : 'bg-[#0B4F3A]/8 dark:bg-[#28b88d]/10 text-[#0B4F3A] dark:text-[#28b88d]'
                  }`}>
                    {isLinkPendente ? <LinkIcon size={14} /> : isLinkPreenchido ? <CheckCircle2 size={14} /> : <User size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                        {c.nome || <span className="italic text-gray-400">Aguardando preenchimento</span>}
                      </p>
                      <Badge variant={info.variant} dot>
                        {info.label}
                      </Badge>
                      {isLinkPreenchido && (
                        <Badge variant="neutral">
                          <Lock size={9} className="mr-0.5" />
                          Link expirado
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 flex-wrap">
                      {c.cpf && <span className="font-mono">{mascararCPF(c.cpf)}</span>}
                      {c.telefone && <span>{c.telefone}</span>}
                      {c.preenchido_em && (
                        <span>preenchido em {formatarData(c.preenchido_em)}</span>
                      )}
                    </div>
                    {isLinkPendente && linkUrl && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <code className="text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate flex-1 bg-gray-50 dark:bg-gray-800/60 px-2 py-1 rounded">
                          {linkUrl}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(linkUrl);
                            toast.success('Link copiado!');
                          }}
                          className="text-[10px] font-bold uppercase tracking-wider text-[#0B4F3A] dark:text-[#28b88d] hover:underline"
                        >
                          Copiar
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removerConvidado(c)}
                    title="Remover"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {linkResumo.length > 0 && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 px-1">
          {linkResumo.filter((l) => l.link_status === 'pendente').length} link(s) pendente(s) ·{' '}
          {linkResumo.filter((l) => l.link_status === 'preenchido').length} preenchido(s)
        </p>
      )}

      {/* Modal: convidado manual */}
      <Modal
        isOpen={modalManual}
        onClose={() => setModalManual(false)}
        title="Adicionar convidado"
        subtitle={evento.titulo}
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setModalManual(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarManual} loading={salvando}>
              Salvar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do convidado"
            startIcon={<User size={15} />}
            maxLength={120}
            required
          />
          <Input
            label="CPF (opcional)"
            value={cpf}
            onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
            placeholder="00000000000"
            startIcon={<IdCard size={15} />}
            maxLength={11}
            className="!font-mono"
          />
          <Input
            label="Telefone (opcional)"
            value={tel}
            onChange={(e) => setTel(e.target.value)}
            placeholder="(00) 00000-0000"
            startIcon={<Phone size={15} />}
            maxLength={20}
          />
          <Input
            label="Observações (opcional)"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Ex.: amigo, familiar..."
            startIcon={<FileText size={15} />}
            maxLength={250}
          />
          {erro && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
              <AlertCircle size={15} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-[12px] font-semibold text-red-700 dark:text-red-300">{erro}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: link gerado */}
      <Modal
        isOpen={modalLink && !!linkGerado}
        onClose={() => {
          setModalLink(false);
          setLinkGerado(null);
        }}
        title="Link de convite criado"
        subtitle={`Para ${evento.titulo}`}
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setModalLink(false);
                setLinkGerado(null);
              }}
            >
              Fechar
            </Button>
            <Button onClick={compartilhar}>Compartilhar</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
            <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 leading-relaxed">
              Este link só pode ser usado uma vez. Após o convidado preencher o nome, ele será
              automaticamente desabilitado.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Link</label>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2.5 text-xs font-mono rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 break-all">
                {linkGerado?.url}
              </code>
              <Button variant="secondary" onClick={copiarLink}>
                <Copy size={14} />
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
