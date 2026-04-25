import { useState, useEffect } from 'react';
import { UserPlus, Eye, EyeOff, Trash2, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import Card from '../../../shared/components/Card';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import Loading from '../../../shared/components/Loading';
import { Usuario } from '../../../shared/types';
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  toggleAtivoUsuario,
  deleteUsuario,
} from '../../../shared/services/usuarioService';
import { toast } from 'sonner';

type PapelFilter = 'todos' | 'admin' | 'porteiro' | 'morador';

const PAPEL_CONFIG: Record<Usuario['papel'], { label: string; color: string; dot: string }> = {
  admin: {
    label: 'Admin',
    color: 'bg-[#0B4F3A]/10 text-[#0B4F3A] dark:bg-[#28b88d]/10 dark:text-[#28b88d]',
    dot: 'bg-[#0B4F3A]',
  },
  porteiro: {
    label: 'Porteiro',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  morador: {
    label: 'Morador',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
};

interface FormState {
  nome: string;
  email: string;
  senha: string;
  papel: Usuario['papel'];
  ativo: boolean;
}

interface ModalState {
  open: boolean;
  mode: 'create' | 'edit';
  usuario: Usuario | null;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<PapelFilter>('todos');
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create', usuario: null });
  const [form, setForm] = useState<FormState>({ nome: '', email: '', senha: '', papel: 'porteiro', ativo: true });
  const [showSenha, setShowSenha] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const condId = Number(import.meta.env.VITE_COND_ID) || 1;

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await getUsuarios(condId);
      setUsuarios(data);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const matchBusca =
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase());
    const matchPapel = filtro === 'todos' || u.papel === filtro;
    return matchBusca && matchPapel;
  });

  const contagem = {
    todos: usuarios.length,
    admin: usuarios.filter((u) => u.papel === 'admin').length,
    porteiro: usuarios.filter((u) => u.papel === 'porteiro').length,
    morador: usuarios.filter((u) => u.papel === 'morador').length,
  };

  const abrirCriar = () => {
    setForm({ nome: '', email: '', senha: '', papel: 'porteiro', ativo: true });
    setShowSenha(false);
    setModal({ open: true, mode: 'create', usuario: null });
  };

  const abrirEditar = (usuario: Usuario) => {
    setForm({ nome: usuario.nome, email: usuario.email, senha: '', papel: usuario.papel, ativo: usuario.ativo });
    setShowSenha(false);
    setModal({ open: true, mode: 'edit', usuario });
  };

  const fecharModal = () => setModal({ open: false, mode: 'create', usuario: null });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        const novo = await createUsuario({ ...form, cond_id: condId });
        setUsuarios((prev) => [novo, ...prev]);
        toast.success('Usuário criado com sucesso!');
      } else if (modal.usuario) {
        const payload: Parameters<typeof updateUsuario>[1] = {
          nome: form.nome,
          email: form.email,
          papel: form.papel,
          ativo: form.ativo,
        };
        if (form.senha) payload.senha = form.senha;
        const atualizado = await updateUsuario(modal.usuario.id, payload);
        setUsuarios((prev) => prev.map((u) => (u.id === atualizado.id ? atualizado : u)));
        toast.success('Usuário atualizado!');
      }
      fecharModal();
    } catch {
      toast.error('Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (usuario: Usuario) => {
    try {
      const atualizado = await toggleAtivoUsuario(usuario.id);
      setUsuarios((prev) => prev.map((u) => (u.id === atualizado.id ? atualizado : u)));
      toast.success(atualizado.ativo ? 'Usuário ativado!' : 'Usuário desativado!');
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteUsuario(id);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      toast.success('Usuário removido!');
    } catch {
      toast.error('Erro ao remover usuário');
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
            Usuários
          </h1>
          <p className="text-xs font-medium text-gray-500 mt-1">
            Controle de acesso e permissões do sistema
          </p>
        </div>
        <Button
          onClick={abrirCriar}
          className="!rounded-full border-0 shadow-md bg-[#0B4F3A] hover:bg-[#073627] text-white text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 flex items-center gap-2 transition-colors"
        >
          <UserPlus size={14} />
          Novo Usuário
        </Button>
      </header>

      {/* Filtros de papel */}
      <div className="flex flex-wrap gap-2">
        {(['todos', 'admin', 'porteiro', 'morador'] as const).map((papel) => (
          <button
            key={papel}
            onClick={() => setFiltro(papel)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all ${
              filtro === papel
                ? 'bg-[#0B4F3A] text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-[#0B4F3A] hover:text-[#0B4F3A]'
            }`}
          >
            {papel === 'todos' ? 'Todos' : PAPEL_CONFIG[papel].label} ({contagem[papel]})
          </button>
        ))}
      </div>

      {/* Tabela */}
      <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden">
        {/* Barra de busca */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              placeholder="Buscar por nome ou e-mail..."
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
                <th className="py-3 px-5">Usuário</th>
                <th className="py-3 px-5">Papel</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Criado em</th>
                <th className="py-3 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-gray-700 dark:text-gray-300">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 dark:text-gray-500 font-medium">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0 ${PAPEL_CONFIG[usuario.papel].dot}`}
                        >
                          {usuario.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100">{usuario.nome}</p>
                          <p className="text-[10px] text-gray-400">{usuario.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${PAPEL_CONFIG[usuario.papel].color}`}
                      >
                        {PAPEL_CONFIG[usuario.papel].label}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          usuario.ativo
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                        }`}
                      >
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-gray-500 dark:text-gray-400">
                      {new Date(usuario.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => abrirEditar(usuario)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#0B4F3A] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleAtivo(usuario)}
                          title={usuario.ativo ? 'Desativar' : 'Ativar'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            usuario.ativo
                              ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                        >
                          {usuario.ativo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(usuario.id)}
                          disabled={deletingId === usuario.id}
                          title="Excluir"
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

        <div className="p-3 px-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
          <p className="text-[10px] font-medium text-gray-500">
            {usuariosFiltrados.length} de {usuarios.length} usuários
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
                  {modal.mode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
                </h3>
                <p className="text-[11px] font-medium text-gray-500">
                  {modal.mode === 'create'
                    ? 'Preencha os dados de acesso ao sistema'
                    : 'Atualize as informações do usuário'}
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
                  placeholder="Nome do usuário"
                  className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">
                  E-mail
                </label>
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">
                  {modal.mode === 'create' ? 'Senha' : 'Nova Senha (opcional)'}
                </label>
                <div className="relative">
                  <Input
                    required={modal.mode === 'create'}
                    type={showSenha ? 'text' : 'password'}
                    value={form.senha}
                    onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))}
                    placeholder={
                      modal.mode === 'create' ? 'Mínimo 6 caracteres' : 'Deixe vazio para não alterar'
                    }
                    className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 !pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha((p) => !p)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    tabIndex={-1}
                  >
                    {showSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">
                  Papel
                </label>
                <select
                  value={form.papel}
                  onChange={(e) => setForm((p) => ({ ...p, papel: e.target.value as Usuario['papel'] }))}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0B4F3A] dark:focus:ring-[#28b88d] transition-colors"
                >
                  <option value="admin">Admin — Acesso total ao sistema</option>
                  <option value="porteiro">Porteiro — Painel da guarita</option>
                  <option value="morador">Morador — Gestão de convidados</option>
                </select>
              </div>

              {modal.mode === 'edit' && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Conta ativa</span>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, ativo: !p.ativo }))}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                      form.ativo ? 'bg-[#0B4F3A]' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        form.ativo ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-50 dark:border-gray-800 mt-6">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 !rounded-xl font-bold tracking-wide shadow-md bg-[#0B4F3A] hover:bg-[#073627] text-white py-2.5"
                >
                  {saving ? 'Salvando...' : modal.mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
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
