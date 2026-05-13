import { useState, useEffect } from 'react';
import { getLotes } from '../../../shared/services/loteService';
import { getQuadras } from '../../../shared/services/quadraService';
import { Lote, Quadra } from '../../../shared/types';
import Card from '../../../shared/components/Card';
import Input from '../../../shared/components/Input';
import Badge from '../../../shared/components/Badge';
import Loading from '../../../shared/components/Loading';
import EmptyState from '../../../shared/components/EmptyState';
import PageHeader from '../../../shared/components/PageHeader';
import { Phone, Search, BookUser, MapPin, PhoneOff } from 'lucide-react';

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

  const getQuadraNome = (quadraId: number) =>
    quadras.find((q) => q.id === quadraId)?.nome || '';

  const getInitials = (nome: string) =>
    nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? '')
      .join('');

  if (loading && lotes.length === 0) return <Loading />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Ramais"
        subtitle="Diretório de contatos dos moradores do condomínio"
        action={
          <Badge variant="brand">
            <BookUser size={11} />
            {lotesFiltrados.length} {lotesFiltrados.length === 1 ? 'morador' : 'moradores'}
          </Badge>
        }
      />

      {/* Search */}
      <Card className="!p-4 sm:!p-5">
        <Input
          placeholder="Buscar por nome do morador ou número do lote..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          startIcon={<Search size={15} />}
        />
      </Card>

      {/* Contacts grid */}
      {lotesFiltrados.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PhoneOff size={20} />}
            title={busca ? 'Nenhum morador encontrado' : 'Sem moradores cadastrados'}
            description={
              busca
                ? 'Tente ajustar os termos da busca.'
                : 'Os ramais aparecerão aqui quando os moradores forem cadastrados.'
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {lotesFiltrados.map((lote) => (
            <Card
              key={lote.id}
              className="!p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[#0B4F3A] to-[#073627] dark:from-[#28b88d]/20 dark:to-[#0B4F3A]/30 flex items-center justify-center shadow-sm">
                  <span className="text-white dark:text-[#28b88d] text-[12px] font-bold tracking-wide">
                    {getInitials(lote.nome_morador || '?')}
                  </span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                    {lote.nome_morador}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin size={10} className="text-gray-400 flex-shrink-0" />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      Q.{getQuadraNome(lote.quadra_id)} — L.{lote.numero}
                    </p>
                  </div>
                  {lote.ramal ? (
                    <p className="text-[11px] font-mono font-bold text-[#0B4F3A] dark:text-[#28b88d] mt-1.5 truncate">
                      {lote.ramal}
                    </p>
                  ) : (
                    <p className="text-[11px] italic text-gray-400 dark:text-gray-500 mt-1.5">
                      Sem ramal
                    </p>
                  )}
                </div>

                {/* Call action */}
                {lote.ramal && (
                  <a
                    href={`tel:${lote.ramal}`}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[#0B4F3A] hover:bg-[#0a3f2f] active:bg-[#073627] text-white shadow-sm hover:shadow-md transition-all"
                    title={`Ligar para ${lote.nome_morador}`}
                  >
                    <Phone size={15} />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
