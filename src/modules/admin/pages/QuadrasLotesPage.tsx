import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Map, Phone, Check, List, Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { getQuadras, createQuadra } from '../../../shared/services/quadraService';
import { getLotes, updateLote, createLote } from '../../../shared/services/loteService';
import { Quadra, Lote } from '../../../shared/types';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Loading from '../../../shared/components/Loading';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import Modal from '../../../shared/components/Modal';
import EmptyState from '../../../shared/components/EmptyState';
import PageHeader from '../../../shared/components/PageHeader';
import MapaCondominio from '../components/MapaCondominio';

type View = 'lista' | 'mapa';

interface FormLote {
  numero: string;
  nome_morador: string;
  ramal: string;
  latitude: string;
  longitude: string;
}

const emptyFormLote: FormLote = { numero: '', nome_morador: '', ramal: '', latitude: '', longitude: '' };

export default function QuadrasLotesPage() {
  const condId = Number(import.meta.env.VITE_COND_ID) || 1;

  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [quadraSelecionada, setQuadraSelecionada] = useState<number | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [lotesPorQuadra, setLotesPorQuadra] = useState<Record<number, Lote[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [view, setView] = useState<View>('lista');

  // — Nova Quadra
  const [modalNovaQuadra, setModalNovaQuadra] = useState(false);
  const [nomeQuadra, setNomeQuadra] = useState('');
  const [savingQuadra, setSavingQuadra] = useState(false);

  // — Novo Lote
  const [modalNovoLote, setModalNovoLote] = useState(false);
  const [formNovoLote, setFormNovoLote] = useState<FormLote>(emptyFormLote);
  const [savingLote, setSavingLote] = useState(false);

  // — Editar Lote
  const [loteEditando, setLoteEditando] = useState<Lote | null>(null);
  const [formEdit, setFormEdit] = useState<FormLote>(emptyFormLote);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => { carregarInicial(); }, []);

  const carregarInicial = async () => {
    setLoading(true);
    try {
      const dadosQuadras = await getQuadras(condId);
      setQuadras(dadosQuadras);
      if (dadosQuadras.length > 0) {
        const lotesArrays = await Promise.all(dadosQuadras.map((q) => getLotes(q.id)));
        const mapa: Record<number, Lote[]> = {};
        dadosQuadras.forEach((q, i) => { mapa[q.id] = lotesArrays[i]; });
        setLotesPorQuadra(mapa);
        setQuadraSelecionada(dadosQuadras[0].id);
        setLotes(mapa[dadosQuadras[0].id] || []);
      }
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const selecionarQuadra = async (quadraId: number) => {
    if (quadraId === quadraSelecionada) return;
    setQuadraSelecionada(quadraId);
    if (lotesPorQuadra[quadraId]) { setLotes(lotesPorQuadra[quadraId]); return; }
    setLoadingLotes(true);
    try {
      const dados = await getLotes(quadraId);
      setLotesPorQuadra((p) => ({ ...p, [quadraId]: dados }));
      setLotes(dados);
    } catch { toast.error('Erro ao carregar lotes'); }
    finally { setLoadingLotes(false); }
  };

  // ── Criar Quadra ────────────────────────────────────────────────────────────
  const handleCriarQuadra = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!nomeQuadra.trim()) return;
    setSavingQuadra(true);
    try {
      const nova = await createQuadra({ nome: nomeQuadra.trim().toUpperCase(), cond_id: condId });
      setQuadras((p) => [...p, nova]);
      setLotesPorQuadra((p) => ({ ...p, [nova.id]: [] }));
      setModalNovaQuadra(false);
      setNomeQuadra('');
      toast.success(`Quadra ${nova.nome} cadastrada!`);
    } catch { toast.error('Erro ao cadastrar quadra'); }
    finally { setSavingQuadra(false); }
  };

  // ── Criar Lote ──────────────────────────────────────────────────────────────
  const handleCriarLote = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!quadraSelecionada || !formNovoLote.numero.trim()) return;
    setSavingLote(true);
    try {
      const novo = await createLote({
        numero: formNovoLote.numero.trim(),
        quadra_id: quadraSelecionada,
        nome_morador: formNovoLote.nome_morador.trim() || null,
        ramal: formNovoLote.ramal.trim() || null,
        latitude: formNovoLote.latitude ? parseFloat(formNovoLote.latitude) : null,
        longitude: formNovoLote.longitude ? parseFloat(formNovoLote.longitude) : null,
      });
      setLotes((p) => [...p, novo]);
      setLotesPorQuadra((p) => ({ ...p, [quadraSelecionada]: [...(p[quadraSelecionada] || []), novo] }));
      setModalNovoLote(false);
      setFormNovoLote(emptyFormLote);
      toast.success(`Lote ${novo.numero} cadastrado!`);
    } catch { toast.error('Erro ao cadastrar lote'); }
    finally { setSavingLote(false); }
  };

  // ── Editar Lote ─────────────────────────────────────────────────────────────
  const abrirEditar = (lote: Lote) => {
    setLoteEditando(lote);
    setFormEdit({
      numero: lote.numero,
      nome_morador: lote.nome_morador || '',
      ramal: lote.ramal || '',
      latitude: lote.latitude?.toString() || '',
      longitude: lote.longitude?.toString() || '',
    });
  };

  const fecharEditar = () => { setLoteEditando(null); setFormEdit(emptyFormLote); };

  const handleSalvarLote = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!loteEditando) return;
    setSavingEdit(true);
    try {
      const payload: Partial<Lote> = {
        ...loteEditando,
        nome_morador: formEdit.nome_morador.trim() || null,
        ramal: formEdit.ramal.trim() || null,
        latitude: formEdit.latitude ? parseFloat(formEdit.latitude) : null,
        longitude: formEdit.longitude ? parseFloat(formEdit.longitude) : null,
      };
      const atualizado = await updateLote(loteEditando.id, payload);
      const patch = (arr: Lote[]) => arr.map((l) => (l.id === atualizado.id ? atualizado : l));
      setLotes(patch);
      if (quadraSelecionada) setLotesPorQuadra((p) => ({ ...p, [quadraSelecionada]: patch(p[quadraSelecionada] || []) }));
      fecharEditar();
      toast.success('Lote atualizado!');
    } catch { toast.error('Erro ao salvar lote'); }
    finally { setSavingEdit(false); }
  };

  const quadraAtual = quadras.find((q) => q.id === quadraSelecionada);

  if (loading) return <Loading label="Carregando quadras e lotes…" />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Quadras & Lotes"
        subtitle="Gerenciamento topográfico do perímetro do condomínio"
        action={
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              onClick={() => setView('lista')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                view === 'lista'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <List size={13} />
              Lista
            </button>
            <button
              onClick={() => setView('mapa')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                view === 'mapa'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Map size={13} />
              Mapa
            </button>
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {view === 'mapa' ? (
          <motion.div
            key="mapa"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <MapaCondominio quadras={quadras} lotesPorQuadra={lotesPorQuadra} />
          </motion.div>
        ) : (
          <motion.div
            key="lista"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 items-start"
          >
            {/* ── Sidebar Quadras ── */}
            <Card variant="default" className="lg:sticky lg:top-6 overflow-hidden p-0">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <LayoutGrid size={13} className="text-gray-400 dark:text-gray-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Setores
                </span>
                <Badge variant="neutral" className="ml-auto">{quadras.length}</Badge>
                <button
                  onClick={() => setModalNovaQuadra(true)}
                  title="Nova Quadra"
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-[#0B4F3A]/10 hover:bg-[#0B4F3A]/20 dark:bg-[#28b88d]/10 dark:hover:bg-[#28b88d]/20 text-[#0B4F3A] dark:text-[#28b88d] transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>
              <div className="p-2 space-y-0.5 overflow-y-auto max-h-[60vh]">
                {quadras.map((quadra) => {
                  const ativa = quadraSelecionada === quadra.id;
                  return (
                    <button
                      key={quadra.id}
                      onClick={() => selecionarQuadra(quadra.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        ativa
                          ? 'bg-[#0B4F3A] text-white shadow-md shadow-[#0B4F3A]/20'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span>Quadra {quadra.nome}</span>
                      {ativa && <span className="w-1.5 h-1.5 rounded-full bg-[#28b88d] animate-pulse" />}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* ── Painel Lotes ── */}
            <Card
              variant="default"
              title="Mapeamento de Lotes"
              action={
                <div className="flex items-center gap-2">
                  {quadraAtual && <Badge variant="brand">Quadra {quadraAtual.nome}</Badge>}
                  {quadraSelecionada && (
                    <Button
                      size="sm"
                      leftIcon={<Plus size={12} />}
                      onClick={() => setModalNovoLote(true)}
                    >
                      Novo Lote
                    </Button>
                  )}
                </div>
              }
              className="overflow-hidden"
            >
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {loadingLotes ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-16 flex items-center justify-center">
                      <Loading />
                    </motion.div>
                  ) : lotes.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <EmptyState
                        icon={<Map size={20} />}
                        title="Nenhum lote registrado"
                        description="Esta quadra ainda não possui lotes. Clique em &quot;Novo Lote&quot; para cadastrar."
                        action={
                          quadraSelecionada ? (
                            <Button size="sm" leftIcon={<Plus size={13} />} onClick={() => setModalNovoLote(true)}>
                              Novo Lote
                            </Button>
                          ) : undefined
                        }
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3"
                    >
                      {lotes.map((lote, i) => {
                        const ocupado = !!lote.nome_morador;
                        return (
                          <motion.div
                            key={lote.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: i * 0.015 }}
                            className={`p-3 rounded-2xl border transition-all duration-200 group flex flex-col justify-between min-h-[88px] relative ${
                              ocupado
                                ? 'border-[#0B4F3A]/20 bg-[#0B4F3A]/5 dark:border-[#28b88d]/20 dark:bg-[#28b88d]/5'
                                : 'border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/30'
                            }`}
                          >
                            {/* Editar — aparece no hover */}
                            <button
                              onClick={() => abrirEditar(lote)}
                              title="Editar lote"
                              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-[#0B4F3A] dark:hover:text-[#28b88d] transition-all"
                            >
                              <Pencil size={10} />
                            </button>

                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Lote</span>
                              <span className={`text-sm font-black ${ocupado ? 'text-[#0B4F3A] dark:text-[#28b88d]' : 'text-gray-700 dark:text-gray-300'}`}>
                                {lote.numero}
                              </span>
                            </div>

                            {ocupado ? (
                              <div className="mt-auto pt-2">
                                <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight truncate">
                                  {lote.nome_morador}
                                </p>
                                {lote.ramal && (
                                  <p className="text-[10px] text-[#0B4F3A]/70 dark:text-[#28b88d]/70 font-mono mt-0.5 flex items-center gap-1 truncate">
                                    <Phone size={9} />
                                    {lote.ramal}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="mt-auto flex justify-center">
                                <Badge variant="inactive">Vazio</Badge>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Nova Quadra ── */}
      <Modal
        isOpen={modalNovaQuadra}
        onClose={() => { setModalNovaQuadra(false); setNomeQuadra(''); }}
        title="Nova Quadra"
        subtitle="Cadastre um novo setor no condomínio"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button type="submit" form="form-nova-quadra" loading={savingQuadra} leftIcon={<Check size={14} />} className="flex-1">
              Cadastrar
            </Button>
            <Button variant="secondary" onClick={() => { setModalNovaQuadra(false); setNomeQuadra(''); }} className="flex-1">
              Cancelar
            </Button>
          </div>
        }
      >
        <form id="form-nova-quadra" onSubmit={handleCriarQuadra}>
          <Input
            label="Nome / Identificador"
            placeholder="Ex: A, B, C ou Norte, Sul…"
            value={nomeQuadra}
            onChange={(e) => setNomeQuadra(e.target.value)}
            required
            autoFocus
          />
        </form>
      </Modal>

      {/* ── Modal: Novo Lote ── */}
      <Modal
        isOpen={modalNovoLote}
        onClose={() => { setModalNovoLote(false); setFormNovoLote(emptyFormLote); }}
        title="Novo Lote"
        subtitle={quadraAtual ? `Quadra ${quadraAtual.nome}` : undefined}
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button type="submit" form="form-novo-lote" loading={savingLote} leftIcon={<Check size={14} />} className="flex-1">
              Cadastrar
            </Button>
            <Button variant="secondary" onClick={() => { setModalNovoLote(false); setFormNovoLote(emptyFormLote); }} className="flex-1">
              Cancelar
            </Button>
          </div>
        }
      >
        <form id="form-novo-lote" onSubmit={handleCriarLote} className="space-y-4">
          <Input
            label="Número do Lote"
            placeholder="Ex: 1, 12, 101…"
            value={formNovoLote.numero}
            onChange={(e) => setFormNovoLote((p) => ({ ...p, numero: e.target.value }))}
            required
            autoFocus
          />
          <Input
            label="Proprietário / Morador"
            placeholder="Nome completo (opcional)"
            value={formNovoLote.nome_morador}
            onChange={(e) => setFormNovoLote((p) => ({ ...p, nome_morador: e.target.value }))}
          />
          <Input
            label="Ramal"
            placeholder="Ex: 1024 (opcional)"
            value={formNovoLote.ramal}
            onChange={(e) => setFormNovoLote((p) => ({ ...p, ramal: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitude"
              type="number"
              step="any"
              placeholder="-15.7801"
              value={formNovoLote.latitude}
              onChange={(e) => setFormNovoLote((p) => ({ ...p, latitude: e.target.value }))}
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              placeholder="-47.9292"
              value={formNovoLote.longitude}
              onChange={(e) => setFormNovoLote((p) => ({ ...p, longitude: e.target.value }))}
            />
          </div>
        </form>
      </Modal>

      {/* ── Modal: Editar Lote ── */}
      <Modal
        isOpen={loteEditando !== null}
        onClose={fecharEditar}
        title="Editar Lote"
        subtitle={loteEditando ? `Quadra ${quadraAtual?.nome} — Lote ${loteEditando.numero}` : undefined}
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button type="submit" form="form-edit-lote" loading={savingEdit} leftIcon={<Check size={14} />} className="flex-1">
              Salvar
            </Button>
            <Button variant="secondary" onClick={fecharEditar} className="flex-1">
              Cancelar
            </Button>
          </div>
        }
      >
        <form id="form-edit-lote" onSubmit={handleSalvarLote} className="space-y-4">
          <Input
            label="Proprietário / Morador"
            placeholder="Nome completo"
            value={formEdit.nome_morador}
            onChange={(e) => setFormEdit((p) => ({ ...p, nome_morador: e.target.value }))}
          />
          <Input
            label="Ramal"
            placeholder="Ex: 1024"
            value={formEdit.ramal}
            onChange={(e) => setFormEdit((p) => ({ ...p, ramal: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitude"
              type="number"
              step="any"
              placeholder="-15.7801"
              value={formEdit.latitude}
              onChange={(e) => setFormEdit((p) => ({ ...p, latitude: e.target.value }))}
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              placeholder="-47.9292"
              value={formEdit.longitude}
              onChange={(e) => setFormEdit((p) => ({ ...p, longitude: e.target.value }))}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
