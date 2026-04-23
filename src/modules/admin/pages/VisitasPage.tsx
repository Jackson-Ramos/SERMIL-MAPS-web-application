import { useState, useEffect } from 'react';
import { getHistoricoVisitas } from '../../../shared/services/visitaService';
import { Visita } from '../../../shared/types';
import Card from '../../../shared/components/Card';
import Loading from '../../../shared/components/Loading';
import { formatarHora } from '../../../shared/utils/tempo';
import { ocultarCPF } from '../../../shared/utils/cpf';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';

export default function VisitasPage() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    quadra: '',
    status: '',
    dataInicio: '',
    dataFim: '',
  });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  useEffect(() => {
    carregarVisitas();
  }, []);

  const carregarVisitas = async () => {
    setLoading(true);
    try {
      const condId = Number(import.meta.env.VITE_COND_ID) || 1;
      const dados = await getHistoricoVisitas(condId, filtros);
      setVisitas(dados);
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = () => {
    const headers = 'CPF,Destino,Entrada,Saída,Duração (min),App,Status\n';
    const rows = visitas
      .map(
        (v) =>
          `${v.cpf},"Quadra ${v.quadra} - Lote ${v.lote}",${formatarHora(
            v.horario_entrada
          )},${v.horario_saida ? formatarHora(v.horario_saida) : '-'},${
            v.duracao_minutos || '-'
          },${v.app_navegacao},${v.status}`
      )
      .join('\n');

    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `visitas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const visitasFiltradas = visitas.filter((v) => {
    if (filtros.quadra && v.quadra !== filtros.quadra) return false;
    if (filtros.status && v.status !== filtros.status) return false;
    
    if (filtros.dataInicio || filtros.dataFim) {
      const dataVisita = new Date(v.horario_entrada);
      dataVisita.setHours(0, 0, 0, 0);

      if (filtros.dataInicio) {
        const inicio = new Date(filtros.dataInicio);
        inicio.setHours(0, 0, 0, 0);
        if (dataVisita < inicio) return false;
      }

      if (filtros.dataFim) {
        const fim = new Date(filtros.dataFim);
        fim.setHours(23, 59, 59, 999);
        if (dataVisita > fim) return false;
      }
    }
    
    return true;
  });

  const totalPaginas = Math.ceil(visitasFiltradas.length / itensPorPagina) || 1;
  const visitasPaginadas = visitasFiltradas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  if (loading && visitas.length === 0) return <Loading />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Sec */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Histórico de Visitas</h1>
          <p className="text-xs font-medium text-gray-500 mt-1">Busca e filtragem avançada de acessos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={exportarCSV} 
            variant="secondary"
            className="!rounded-full border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 text-[11px] font-bold uppercase tracking-widest px-4 py-2 flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Exportar CSV
          </Button>
        </div>
      </header>

      {/* Filtros */}
      <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden">
        <div className="py-2.5 px-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wide flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filtros de Busca
          </h3>
        </div>
        <div className="p-4 bg-white dark:bg-gray-900/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Quadra</label>
              <Input
                placeholder="Ex: A"
                value={filtros.quadra}
                onChange={(e) => setFiltros({ ...filtros, quadra: e.target.value })}
                className="!text-sm !py-2 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Status</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-[#0B4F3A] focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:text-white"
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
              >
                <option value="">Todos os status</option>
                <option value="ativa">Ativa</option>
                <option value="encerrada">Encerrada</option>
                <option value="expirada">Expirada</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Data Início</label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                className="!text-sm !py-2 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Data Fim</label>
              <Input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                className="!text-sm !py-2 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm"
              />
            </div>
          </div>
          <div className="flex justify-end mt-5 pt-4 border-t border-gray-50 dark:border-gray-800">
            <Button 
              onClick={carregarVisitas} 
              className="!rounded-full text-[11px] font-bold tracking-widest uppercase px-6 shadow-sm bg-[#0B4F3A] hover:bg-[#073627] text-white transition-colors"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabela de Resultados */}
      <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden">
        <div className="overflow-x-auto bg-white dark:bg-gray-900">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-3 px-4">Identificação (CPF)</th>
                <th className="py-3 px-4">Destino</th>
                <th className="py-3 px-4">Entrada</th>
                <th className="py-3 px-4">Saída</th>
                <th className="py-3 px-4">Duração</th>
                <th className="py-3 px-4">Vetor (App)</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-gray-700 dark:text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">Carregando dados...</td>
                </tr>
              ) : visitasPaginadas.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-gray-500 font-medium text-[11px]">
                     Nenhum registro encontrado com os filtros atuais.
                   </td>
                 </tr>
              ) : (
                visitasPaginadas.map((visita) => (
                  <tr key={visita.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-gray-900 dark:text-gray-100">{ocultarCPF(visita.cpf)}</td>
                    <td className="py-2.5 px-4">
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                        Q.{visita.quadra} - L.{visita.lote}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono">{formatarHora(visita.horario_entrada)}</td>
                    <td className="py-2.5 px-4 font-mono text-gray-500">{visita.horario_saida ? formatarHora(visita.horario_saida) : '-'}</td>
                    <td className="py-2.5 px-4">{visita.duracao_minutos ? `${visita.duracao_minutos} min` : '-'}</td>
                    <td className="py-2.5 px-4 font-medium">{visita.app_navegacao}</td>
                    <td className="py-2.5 px-4 flex items-center gap-1.5">
                      {visita.status === 'ativa' && (
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-sm"></span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full font-bold tracking-wide uppercase ${
                          visita.status === 'ativa'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : visita.status === 'encerrada'
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {visita.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="p-3 px-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[11px] font-medium text-gray-500">
            Mostrando <span className="font-bold text-gray-900 dark:text-white">{visitasPaginadas.length}</span> de <span className="font-bold text-gray-900 dark:text-white">{visitasFiltradas.length}</span> registros
          </p>
          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 p-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
              disabled={paginaAtual === 1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="px-3 text-[11px] font-bold text-gray-700 dark:text-gray-300">
              {paginaAtual} / {totalPaginas}
            </span>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
              disabled={paginaAtual === totalPaginas}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
