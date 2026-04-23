import { useState, useEffect } from 'react';
import { getLotes } from '../../../shared/services/loteService';
import { getQuadras } from '../../../shared/services/quadraService';
import { Lote, Quadra } from '../../../shared/types';
import Card from '../../../shared/components/Card';
import Input from '../../../shared/components/Input';
import { Phone } from 'lucide-react';
import Loading from '../../../shared/components/Loading';

export default function RamalPage() {
  const [busca, setBusca] = useState('');
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const condId = Number(import.meta.env.VITE_COND_ID) || 1;
      const dadosQuadras = await getQuadras(condId);
      setQuadras(dadosQuadras);
      const todosLotes: Lote[] = [];
      for (const quadra of dadosQuadras) {
        const lotesQuadra = await getLotes(quadra.id);
        todosLotes.push(...lotesQuadra);
      }
      setLotes(todosLotes);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const lotesFiltrados = lotes.filter(
    (lote) =>
      lote.nome_morador &&
      (lote.nome_morador.toLowerCase().includes(busca.toLowerCase()) ||
        lote.numero.includes(busca))
  );

  const getQuadraNome = (quadraId: number) => quadras.find((q) => q.id === quadraId)?.nome || '';

  if (loading && lotes.length === 0) return <Loading />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Ramais</h1>
          <p className="text-xs font-medium text-gray-500 mt-1">Diretório de contatos do condomínio</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
          {lotesFiltrados.length} morador(es)
        </span>
      </header>

      <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden">
        <div className="p-4 bg-white dark:bg-gray-900">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <Input
              placeholder="Buscar por nome do morador ou número do lote..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="!pl-10 !text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {lotesFiltrados.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 font-medium text-sm">
            Nenhum morador encontrado.
          </div>
        ) : (
          lotesFiltrados.map((lote) => (
            <div
              key={lote.id}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex justify-between items-center gap-4"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">{lote.nome_morador}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full font-medium">Q.{getQuadraNome(lote.quadra_id)} — L.{lote.numero}</span>
                </p>
                {lote.ramal && (
                  <p className="text-[11px] font-mono text-[#0B4F3A] dark:text-green-400 font-bold mt-1.5">📞 {lote.ramal}</p>
                )}
              </div>
              {lote.ramal && (
                <a
                  href={`tel:${lote.ramal}`}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[#0B4F3A] hover:bg-[#073627] text-white shadow-sm transition-colors"
                >
                  <Phone size={16} />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
