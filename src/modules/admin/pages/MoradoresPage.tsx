import { useState, useEffect } from 'react';
import { UserPlus, Phone, Pencil, Trash2 } from 'lucide-react';
import Card from '../../../shared/components/Card';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import Loading from '../../../shared/components/Loading';
import { Morador, Quadra, Lote } from '../../../shared/types';
import { getMoradores, createMorador, updateMorador, deleteMorador } from '../../../shared/services/moradorService';
import { getQuadras } from '../../../shared/services/quadraService';
import { getLotes } from '../../../shared/services/loteService';
import { ocultarCPF } from '../../../shared/utils/cpf';
import { toast } from 'sonner';

interface FormState {
  nome: string;
  cpf: string;
  quadra_id: number | '';
  lote_id: number | '';
  ramal: string;
}

interface ModalState {
  open: boolean;
  mode: 'create' | 'edit';
  morador: Morador | null;
}

export default function MoradoresPage() {
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroQuadra, setFiltroQuadra] = useState<number | 'todos'>('todos');
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create', morador: null });
  const [form, setForm] = useState<FormState>({ nome: '', cpf: '', quadra_id: '', lote_id: '', ramal: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const condId = Number(import.meta.env.VITE_COND_ID) || 1;

  useEffect(() => {
    Promise.all([carregarMoradores(), carregarQuadras()]);
  }, []);

  useEffect(() => {
    if (form.quadra_id !== '') {
      carregarLotes(Number(form.quadra_id));
    } else {
      setLotes([]);
    }
  }, [form.quadra_id]);

  const carregarMoradores = async () => {
    setLoading(true);
    try {
      const data = await getMoradores(condId);
      setMoradores(data);
    } catch {
      toast.error('Erro ao carregar moradores');
    } finally {
      setLoading(false);
    }
  };

  const carregarQuadras = async () => {
    try {
      const data = await getQuadras(condId);
      setQuadras(data);
    } catch {
      toast.error('Erro ao carregar quadras');
    }
  };

  const carregarLotes = async (quadraId: number) => {
    setLoadingLotes(true);
    try {
      const data = await getLotes(quadraId);
      setLotes(data);
    } catch {
      toast.error('Erro ao carregar lotes');
    } finally {
      setLoadingLotes(false);
    }
  };

  const moradoresFiltrados = moradores.filter((m) => {
    const matchBusca = m.nome.toLowerCase().includes(busca.toLowerCase());
    const matchQuadra = filtroQuadra === 'todos' || m.quadra === quadras.find((q) => q.id === filtroQuadra)?.nome;
    return matchBusca && matchQuadra;
  });

  const abrirCriar = () => {
    setForm({ nome: '', cpf: '', quadra_id: '', lote_id: '', ramal: '' });
    setLotes([]);
    setModal({ open: true, mode: 'create', morador: null });
  };

  const abrirEditar = (morador: Morador) => {
    const quadra = quadras.find((q) => q.nome === morador.quadra);
    setForm({
      nome: morador.nome,
      cpf: morador.cpf,
      quadra_id: quadra?.id ?? '',
      lote_id: morador.lote_id,
      ramal: morador.ramal,
    });
    if (quadra) carregarLotes(quadra.id);
    setModal({ open: true, mode: 'edit', morador });
  };

  const fecharModal = () => setModal({ open: false, mode: 'create', morador: null });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.lote_id === '') {
      toast.error('Selecione um lote');
      return;
    }
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        const novo = await createMorador({
          nome: form.nome,
          cpf: form.cpf,
          lote_id: Number(form.lote_id),
          ramal: form.ramal,
          cond_id: condId,
        });
        setMoradores((prev) => [novo, ...prev]);
        toast.success('Morador cadastrado com sucesso!');
      } else if (modal.morador) {
        const atualizado = await updateMorador(modal.morador.id, {
          nome: form.nome,
          cpf: form.cpf,
          lote_id: Number(form.lote_id),
          ramal: form.ramal,
        });
        setMoradores((prev) => prev.map((m) => (m.id === atualizado.id ? atualizado : m)));
        toast.success('Morador atualizado!');
      }
      fecharModal();
    } catch {
      toast.error('Erro ao salvar morador');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteMorador(id);
      setMoradores((prev) => prev.filter((m) => m.id !== id));
      toast.success('Morador removido!');
    } catch {
      toast.error('Erro ao remover morador');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Moradores
          </h1>
          <p className="text-xs font-medium text-gray-500 mt-1">
            Diretório de proprietários e residentes cadastrados
          </p>
        </div>
        <Button
          onClick={abrirCriar}
          className="!rounded-full border-0 shadow-md bg-[#0B4F3A] hover:bg-[#073627] text-white text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 flex items-center gap-2 transition-colors"
        >
          <UserPlus size={14} />
          Novo Morador
        </Button>
      </header>

      {/* Tabela principal */}
      <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden">
        {/* Filtros */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFiltroQuadra('todos')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all ${
                filtroQuadra === 'todos'
                  ? 'bg-[#0B4F3A] text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-[#0B4F3A]'
              }`}
            >
              Todas ({moradores.length})
            </button>
            {quadras.map((q) => {
              const count = moradores.filter((m) => m.quadra === q.nome).length;
              return (
                <button
                  key={q.id}
                  onClick={() => setFiltroQuadra(q.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all ${
                    filtroQuadra === q.id
                      ? 'bg-[#0B4F3A] text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-[#0B4F3A]'
                  }`}
                >
                  Quadra {q.nome} ({count})
                </button>
              );
            })}
          </div>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              placeholder="Buscar morador..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="!text-sm !py-2 !pl-10 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto bg-white dark:bg-gray-900">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-3 px-5">Morador</th>
                <th className="py-3 px-5">CPF</th>
                <th className="py-3 px-5">Localização</th>
                <th className="py-3 px-5">Ramal</th>
                <th className="py-3 px-5">Conta</th>
                <th className="py-3 px-5 text-center">Visitas</th>
                <th className="py-3 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-gray-700 dark:text-gray-300">
              {moradoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-gray-500 font-medium">
                    Nenhum morador encontrado.
                  </td>
                </tr>
              ) : (
                moradoresFiltrados.map((morador) => (
                  <tr
                    key={morador.id}
                    className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="py-3 px-5 font-bold text-gray-900 dark:text-gray-100">
                      {morador.nome}
                    </td>
                    <td className="py-3 px-5 font-mono text-gray-500 dark:text-gray-400">
                      {ocultarCPF(morador.cpf)}
                    </td>
                    <td className="py-3 px-5">
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full font-medium">
                        Q.{morador.quadra} — L.{morador.lote}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Phone size={11} />
                        {morador.ramal}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      {morador.user_id ? (
                        <span className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full text-[10px] font-bold">
                          Vinculado
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold">
                          Sem conta
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className="bg-[#0B4F3A]/10 text-[#0B4F3A] dark:bg-[#28b88d]/10 dark:text-[#28b88d] px-2 py-1 rounded-full font-bold">
                        {morador.total_visitas}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => abrirEditar(morador)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#0B4F3A] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(morador.id)}
                          disabled={deletingId === morador.id}
                          title="Remover"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 px-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 flex justify-between items-center">
          <p className="text-[10px] font-medium text-gray-500">
            {moradoresFiltrados.length} de {moradores.length} moradores
          </p>
        </div>
      </Card>

      {/* Modal criar / editar */}
      {modal.open && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-50 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  {modal.mode === 'create' ? 'Novo Morador' : 'Editar Morador'}
                </h3>
                <p className="text-[11px] font-medium text-gray-500">
                  {modal.mode === 'create'
                    ? 'Cadastro de proprietário ou residente'
                    : 'Atualize os dados do morador'}
                </p>
              </div>
              <button
                onClick={fecharModal}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">
                  Nome Completo
                </label>
                <Input
                  required
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Nome do morador"
                  className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">
                  CPF
                </label>
                <Input
                  required
                  value={form.cpf}
                  onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">
                    Quadra
                  </label>
                  <select
                    required
                    value={form.quadra_id}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, quadra_id: Number(e.target.value), lote_id: '' }))
                    }
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0B4F3A] transition-colors"
                  >
                    <option value="">Selecionar</option>
                    {quadras.map((q) => (
                      <option key={q.id} value={q.id}>
                        Quadra {q.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">
                    Lote
                  </label>
                  <select
                    required
                    value={form.lote_id}
                    onChange={(e) => setForm((p) => ({ ...p, lote_id: Number(e.target.value) }))}
                    disabled={form.quadra_id === '' || loadingLotes}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0B4F3A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingLotes ? 'Carregando...' : form.quadra_id === '' ? 'Escolha a quadra' : 'Selecionar'}
                    </option>
                    {lotes.map((l) => (
                      <option key={l.id} value={l.id}>
                        Lote {l.numero}
                        {l.nome_morador ? ` — ${l.nome_morador}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">
                  Ramal
                </label>
                <Input
                  required
                  value={form.ramal}
                  onChange={(e) => setForm((p) => ({ ...p, ramal: e.target.value }))}
                  placeholder="Ex: 1024"
                  className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 font-mono"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-50 dark:border-gray-800 mt-6">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 !rounded-xl font-bold tracking-wide shadow-md bg-[#0B4F3A] hover:bg-[#073627] text-white py-2.5"
                >
                  {saving
                    ? 'Salvando...'
                    : modal.mode === 'create'
                    ? 'Confirmar Cadastro'
                    : 'Salvar Alterações'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={fecharModal}
                  className="flex-1 !rounded-xl font-bold tracking-wide py-2.5"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
