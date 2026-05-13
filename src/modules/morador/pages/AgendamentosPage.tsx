import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  XCircle,
  AlertCircle,
  User,
  IdCard,
  FileText,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import Card from '../../../shared/components/Card';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import Badge, { BadgeVariant } from '../../../shared/components/Badge';
import EmptyState from '../../../shared/components/EmptyState';
import PageHeader from '../../../shared/components/PageHeader';
import Modal from '../../../shared/components/Modal';
import { Agendamento } from '../../../shared/types';
import {
  getAgendamentos,
  criarAgendamento,
  atualizarAgendamento,
  excluirAgendamento,
} from '../../../shared/services/agendamentoService';
import { mascararCPF } from '../../../shared/utils/cpf';

const statusVariant: Record<Agendamento['status'], BadgeVariant> = {
  agendado: 'warning',
  realizada: 'success',
  cancelada: 'neutral',
  expirada: 'expirada',
};

const statusLabel: Record<Agendamento['status'], string> = {
  agendado: 'Agendado',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  expirada: 'Expirada',
};

function formatarData(iso: string): string {
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

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [data, setData] = useState('');
  const [obs, setObs] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    setLoading(true);
    try {
      setAgendamentos(await getAgendamentos());
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = () => {
    setNome('');
    setCpf('');
    setData('');
    setObs('');
    setErro('');
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    setErro('');
    if (!nome.trim()) {
      setErro('Informe o nome do visitante.');
      return;
    }
    if (!data) {
      setErro('Informe a data e hora prevista.');
      return;
    }
    setSalvando(true);
    try {
      await criarAgendamento({
        nome_visitante: nome.trim(),
        cpf: cpf.replace(/\D/g, '') || undefined,
        data_prevista: data,
        observacoes: obs.trim() || undefined,
      });
      toast.success('Agendamento criado!');
      setModalAberto(false);
      carregar();
    } catch (e: any) {
      setErro(e.message || 'Erro ao criar agendamento');
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = async (a: Agendamento) => {
    if (!confirm('Cancelar este agendamento?')) return;
    try {
      await atualizarAgendamento(a.id, { status: 'cancelada' });
      toast.success('Agendamento cancelado');
      carregar();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao cancelar');
    }
  };

  const handleExcluir = async (a: Agendamento) => {
    if (!confirm('Excluir este agendamento?')) return;
    try {
      await excluirAgendamento(a.id);
      toast.success('Agendamento excluído');
      carregar();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <PageHeader
        title="Meus Agendamentos"
        subtitle="Programe a chegada dos seus visitantes"
        action={
          <Button onClick={abrirModal} size="md">
            <Plus size={15} />
            Novo agendamento
          </Button>
        }
      />

      <Card className="!p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={13} className="text-gray-500" />
            <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wider">
              Agendamentos
            </h3>
          </div>
          <Badge variant="neutral">{agendamentos.length}</Badge>
        </div>

        {loading ? (
          <div className="p-6 text-center text-sm text-gray-500">Carregando...</div>
        ) : agendamentos.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={20} />}
            title="Nenhum agendamento"
            description="Crie um agendamento para preparar a entrada do seu visitante."
            action={
              <Button onClick={abrirModal} size="md">
                <Plus size={15} />
                Novo agendamento
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {agendamentos.map((a) => (
              <div key={a.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0B4F3A]/8 dark:bg-[#28b88d]/10 flex items-center justify-center flex-shrink-0">
                  <CalendarDays size={16} className="text-[#0B4F3A] dark:text-[#28b88d]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {a.nome_visitante}
                    </p>
                    <Badge variant={statusVariant[a.status]} dot>
                      {statusLabel[a.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 dark:text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatarData(a.data_prevista)}
                    </span>
                    {a.cpf && (
                      <span className="font-mono">{mascararCPF(a.cpf)}</span>
                    )}
                  </div>
                  {a.observacoes && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 italic truncate">
                      {a.observacoes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {a.status === 'agendado' && (
                    <button
                      onClick={() => handleCancelar(a)}
                      title="Cancelar"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                    >
                      <XCircle size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => handleExcluir(a)}
                    title="Excluir"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Novo agendamento"
        subtitle="Programe a chegada do seu visitante"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} loading={salvando}>
              Salvar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome do visitante"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome completo"
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
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Data e hora previstas
            </label>
            <input
              type="datetime-local"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0B4F3A] dark:focus:ring-[#28b88d]"
            />
          </div>
          <Input
            label="Observações (opcional)"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Ex.: chegará de carro, entregador..."
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
    </div>
  );
}
