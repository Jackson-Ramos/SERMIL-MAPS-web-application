import { useState, useEffect } from 'react';
import { getQuadras } from '../../../shared/services/quadraService';
import { getLotes, updateLote, importLotesCSV } from '../../../shared/services/loteService';
import { Quadra, Lote } from '../../../shared/types';
import Card from '../../../shared/components/Card';
import Loading from '../../../shared/components/Loading';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';

export default function QuadrasLotesPage() {
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [quadraSelecionada, setQuadraSelecionada] = useState<number | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteEditando, setLoteEditando] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarQuadras();
  }, []);

  const carregarQuadras = async () => {
    setLoading(true);
    try {
      const condId = Number(import.meta.env.VITE_COND_ID) || 1;
      const dados = await getQuadras(condId);
      setQuadras(dados);
      if (dados.length > 0 && !quadraSelecionada) {
        setQuadraSelecionada(dados[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar quadras:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quadraSelecionada) {
      carregarLotes(quadraSelecionada);
    }
  }, [quadraSelecionada]);

  const carregarLotes = async (quadraId: number) => {
    try {
      const dados = await getLotes(quadraId);
      setLotes(dados);
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
    }
  };

  const salvarLote = async (lote: Lote) => {
    try {
      await updateLote(lote.id, lote);
      setLoteEditando(null);
      if (quadraSelecionada) {
        carregarLotes(quadraSelecionada);
      }
    } catch (error) {
      console.error('Erro ao salvar lote:', error);
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const condId = Number(import.meta.env.VITE_COND_ID) || 1;
      await importLotesCSV(condId, file);
      carregarQuadras();
      if (quadraSelecionada) {
        carregarLotes(quadraSelecionada);
      }
    } catch (error) {
      console.error('Erro ao importar CSV:', error);
    }
  };

  const quadraAtual = quadras.find(q => q.id === quadraSelecionada);

  if (loading && quadras.length === 0) return <Loading />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Sec */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Quadras & Lotes</h1>
          <p className="text-xs font-medium text-gray-500 mt-1">Gerenciamento topográfico do perímetro</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="csv-upload" className="cursor-pointer">
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCSV}
            />
            <span className="inline-flex items-center gap-2 !rounded-full border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 text-[11px] font-bold uppercase tracking-widest px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Importar CSV
            </span>
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 items-start">
        {/* Sidebar Quadras */}
        <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden flex flex-col lg:sticky lg:top-6">
          <div className="py-2.5 px-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
            <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wide flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Setores (Quadras)
            </h3>
          </div>
          <div className="p-3 space-y-1 overflow-y-auto max-h-[60vh] custom-scrollbar bg-white dark:bg-gray-900/20">
            {quadras.map((quadra) => (
              <button
                key={quadra.id}
                onClick={() => setQuadraSelecionada(quadra.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  quadraSelecionada === quadra.id
                    ? 'bg-gradient-to-r from-[#0B4F3A] to-[#073627] text-white shadow-md shadow-[#0B4F3A]/20 scale-[1.02]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>Quadra {quadra.nome}</span>
                {quadraSelecionada === quadra.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Main Grid Lotes */}
        <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden flex flex-col">
          <div className="py-2.5 px-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
            <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wide flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              Mapeamento de Lotes
            </h3>
            {quadraAtual && (
              <span className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-500 shadow-sm">
                QUADRA {quadraAtual.nome}
              </span>
            )}
          </div>
          <div className="p-4 bg-white dark:bg-gray-900/20">
            {lotes.length === 0 ? (
               <div className="py-12 text-center text-gray-400 dark:text-gray-500 font-medium text-xs">
                 Nenhum lote registrado nesta quadra.
               </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {lotes.map((lote) => (
                  <div
                    key={lote.id}
                    onClick={() => setLoteEditando(lote.id)}
                    className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg group flex flex-col justify-between min-h-[85px] ${
                      lote.nome_morador
                        ? 'border-green-200 bg-green-50/60 dark:border-green-900/40 dark:bg-green-900/10 hover:border-green-300'
                        : 'border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase group-hover:text-gray-500 transition-colors">Lote</span>
                      <span className={`text-sm font-black ${lote.nome_morador ? 'text-green-800 dark:text-green-400' : 'text-gray-800 dark:text-gray-300'}`}>
                        {lote.numero}
                      </span>
                    </div>
                    {lote.nome_morador ? (
                      <div className="mt-auto pt-2">
                        <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight truncate">{lote.nome_morador}</p>
                        {lote.ramal && (
                          <p className="text-[10px] text-green-600/80 dark:text-green-500/80 font-mono mt-0.5 truncate">📞 {lote.ramal}</p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-auto pt-2 flex items-center justify-center">
                        <span className="text-[10px] font-medium text-gray-400/80 uppercase tracking-widest bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-700">
                          Vazio
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de Edição */}
      {loteEditando && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 w-[400px] shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-50 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Editar Lote</h3>
                <p className="text-[11px] font-medium text-gray-500">Quadra {quadraAtual?.nome} - Lote {lotes.find(l => l.id === loteEditando)?.numero}</p>
              </div>
              <button 
                onClick={() => setLoteEditando(null)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const lote = lotes.find((l) => l.id === loteEditando);
                if (lote) salvarLote(lote);
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Proprietário / Morador</label>
                <Input
                  placeholder="Nome completo"
                  value={lotes.find((l) => l.id === loteEditando)?.nome_morador || ''}
                  onChange={(e) =>
                    setLotes(
                      lotes.map((l) =>
                        l.id === loteEditando ? { ...l, nome_morador: e.target.value } : l
                      )
                    )
                  }
                  className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Ramal de Comunicação</label>
                <Input
                  placeholder="Ex: 1024"
                  value={lotes.find((l) => l.id === loteEditando)?.ramal || ''}
                  onChange={(e) =>
                    setLotes(
                      lotes.map((l) =>
                        l.id === loteEditando ? { ...l, ramal: e.target.value } : l
                      )
                    )
                  }
                  className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Latitude</label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="-0.0000"
                    value={lotes.find((l) => l.id === loteEditando)?.latitude || ''}
                    onChange={(e) =>
                      setLotes(
                        lotes.map((l) =>
                          l.id === loteEditando
                            ? { ...l, latitude: parseFloat(e.target.value) }
                            : l
                        )
                      )
                    }
                    className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Longitude</label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="-0.0000"
                    value={lotes.find((l) => l.id === loteEditando)?.longitude || ''}
                    onChange={(e) =>
                      setLotes(
                        lotes.map((l) =>
                          l.id === loteEditando
                            ? { ...l, longitude: parseFloat(e.target.value) }
                            : l
                        )
                      )
                    }
                    className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-50 dark:border-gray-800 mt-6">
                <Button 
                  type="submit" 
                  className="flex-1 !rounded-xl font-bold tracking-wide shadow-md bg-[#0B4F3A] hover:bg-[#073627] text-white py-2.5"
                >
                  Salvar Alterações
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setLoteEditando(null)}
                  className="flex-1 !rounded-xl font-bold tracking-wide border border-gray-200 dark:border-gray-700 py-2.5 hover:bg-gray-50"
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
