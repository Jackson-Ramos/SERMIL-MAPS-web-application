import { useState, useEffect } from 'react';
import { Filter, Download, ChevronLeft, ChevronRight, MapPin, ClipboardList } from 'lucide-react';
import { getHistoricoVisitas } from '../../../shared/services/visitaService';
import { Visita } from '../../../shared/types';
import { Card, Loading, Badge, EmptyState, PageHeader, Button } from '../../../shared/components';
import Input from '../../../shared/components/Input';
import { formatarHora } from '../../../shared/utils/tempo';
import { ocultarCPF } from '../../../shared/utils/cpf';

const APP_LABELS: Record<string, string> = {
  interno: 'Mapa Interno',
  gmaps:   'Google Maps',
  waze:    'Waze',
};

const ITENS_POR_PAGINA = 10;

export default function VisitasPage() {
  const [visitas, setVisitas]         = useState<Visita[]>([]);
  const [loading, setLoading]         = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [filtros, setFiltros]         = useState({
    quadra:     '',
    status:     '',
    dataInicio: '',
    dataFim:    '',
  });

  useEffect(() => { carregarVisitas(); }, []);

  const carregarVisitas = async () => {
    setLoading(true);
    try {
      const condId = Number(import.meta.env.VITE_COND_ID) || 1;
      const dados  = await getHistoricoVisitas(condId, filtros);
      setVisitas(dados);
      setPaginaAtual(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    setFiltros({ quadra: '', status: '', dataInicio: '', dataFim: '' });
  };

  const exportarCSV = () => {
    const headers = 'CPF,Destino,Entrada,Saída,Duração (min),App,Status\n';
    const rows = visitas.map((v) =>
      `${v.cpf},"Quadra ${v.quadra} - Lote ${v.lote}",${formatarHora(v.horario_entrada)},` +
      `${v.horario_saida ? formatarHora(v.horario_saida) : '-'},` +
      `${v.duracao_minutos ?? '-'},${v.app_navegacao},${v.status}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `visitas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ── Filtering ───────────────────────────────────────────────────────────
  const visitasFiltradas = visitas.filter((v) => {
    if (filtros.quadra && v.quadra !== filtros.quadra) return false;
    if (filtros.status && v.status !== filtros.status)  return false;
    if (filtros.dataInicio || filtros.dataFim) {
      const d = new Date(v.horario_entrada);
      d.setHours(0, 0, 0, 0);
      if (filtros.dataInicio) {
        const ini = new Date(filtros.dataInicio); ini.setHours(0, 0, 0, 0);
        if (d < ini) return false;
      }
      if (filtros.dataFim) {
        const fim = new Date(filtros.dataFim); fim.setHours(23, 59, 59, 999);
        if (d > fim) return false;
      }
    }
    return true;
  });

  const totalPaginas    = Math.max(1, Math.ceil(visitasFiltradas.length / ITENS_POR_PAGINA));
  const visitasPaginadas = visitasFiltradas.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual       * ITENS_POR_PAGINA,
  );

  const temFiltroAtivo = filtros.quadra || filtros.status || filtros.dataInicio || filtros.dataFim;

  if (loading && visitas.length === 0) return <Loading label="Carregando registros..." />;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Histórico de Visitas"
        subtitle="Busca e filtragem avançada de acessos ao perímetro"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={exportarCSV}
            leftIcon={<Download size={14} />}
          >
            Exportar CSV
          </Button>
        }
      />

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-7 h-7 rounded-lg bg-[#0B4F3A]/8 dark:bg-[#28b88d]/8 flex items-center justify-center">
            <Filter className="w-3.5 h-3.5 text-[#0B4F3A] dark:text-[#28b88d]" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Filtros de Busca
          </p>
          {temFiltroAtivo && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-[#0B4F3A]/10 text-[#0B4F3A] dark:bg-[#28b88d]/10 dark:text-[#28b88d] text-[10px] font-bold">
              Ativo
            </span>
          )}
        </div>

        {/* Filter fields */}
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Quadra"
              placeholder="Ex: A"
              value={filtros.quadra}
              onChange={(e) => setFiltros((p) => ({ ...p, quadra: e.target.value }))}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros((p) => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0B4F3A] dark:focus:ring-[#28b88d] focus:border-transparent transition-all duration-200"
              >
                <option value="">Todos os status</option>
                <option value="ativa">Ativa</option>
                <option value="encerrada">Encerrada</option>
                <option value="expirada">Expirada</option>
              </select>
            </div>

            <Input
              label="Data início"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros((p) => ({ ...p, dataInicio: e.target.value }))}
            />

            <Input
              label="Data fim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros((p) => ({ ...p, dataFim: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            {temFiltroAtivo && (
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                Limpar
              </Button>
            )}
            <Button size="sm" onClick={carregarVisitas} leftIcon={<Filter size={13} />}>
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Results table ───────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0B4F3A]/8 dark:bg-[#28b88d]/8 flex items-center justify-center">
              <ClipboardList className="w-3.5 h-3.5 text-[#0B4F3A] dark:text-[#28b88d]" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Registros
            </p>
          </div>
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
            {visitasFiltradas.length} resultado{visitasFiltradas.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table body */}
        {loading ? (
          <Loading size="sm" label="Atualizando..." />
        ) : visitasPaginadas.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-5 h-5" />}
            title="Nenhum registro encontrado"
            description="Tente ajustar os filtros ou ampliar o período de busca."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Identificação', 'Destino', 'Entrada', 'Saída', 'Duração', 'App', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visitasPaginadas.map((visita) => (
                  <tr
                    key={visita.id}
                    className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    {/* CPF */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {ocultarCPF(visita.cpf)}
                      </span>
                    </td>

                    {/* Destino */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                        <MapPin className="w-3 h-3 opacity-50" />
                        Q.{visita.quadra} — L.{visita.lote}
                      </span>
                    </td>

                    {/* Entrada */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                        {formatarHora(visita.horario_entrada)}
                      </span>
                    </td>

                    {/* Saída */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-500 tabular-nums">
                        {visita.horario_saida ? formatarHora(visita.horario_saida) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </span>
                    </td>

                    {/* Duração */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      {visita.duracao_minutos ? (
                        <span className={`text-xs font-semibold tabular-nums ${
                          visita.duracao_minutos < 30  ? 'text-green-600 dark:text-green-400' :
                          visita.duracao_minutos < 60  ? 'text-amber-600 dark:text-amber-400' :
                                                         'text-red-600 dark:text-red-400'
                        }`}>
                          {visita.duracao_minutos} min
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>

                    {/* App */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {APP_LABELS[visita.app_navegacao] ?? visita.app_navegacao}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Badge
                        variant={visita.status as 'ativa' | 'encerrada' | 'expirada'}
                        dot={visita.status === 'ativa'}
                      >
                        {visita.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {visitasFiltradas.length > ITENS_POR_PAGINA && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Mostrando{' '}
              <span className="font-bold text-gray-700 dark:text-gray-300">
                {(paginaAtual - 1) * ITENS_POR_PAGINA + 1}–
                {Math.min(paginaAtual * ITENS_POR_PAGINA, visitasFiltradas.length)}
              </span>{' '}
              de{' '}
              <span className="font-bold text-gray-700 dark:text-gray-300">
                {visitasFiltradas.length}
              </span>{' '}
              registros
            </p>

            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft size={15} />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 1)
                .reduce<(number | '…')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === '…' ? (
                    <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-[11px] text-gray-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPaginaAtual(item as number)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                        paginaAtual === item
                          ? 'bg-[#0B4F3A] text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-800'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
