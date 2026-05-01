import { useState } from 'react';
import { getHistoricoVisitas } from '../../../shared/services/visitaService';
import { Visita } from '../../../shared/types';
import Card from '../../../shared/components/Card';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import Badge, { BadgeVariant } from '../../../shared/components/Badge';
import EmptyState from '../../../shared/components/EmptyState';
import PageHeader from '../../../shared/components/PageHeader';
import { formatarHora } from '../../../shared/utils/tempo';
import { mascararCPF } from '../../../shared/utils/cpf';
import { Search, Eye, FileText, MapPin, Clock, LogOut, Compass, Hash } from 'lucide-react';

export default function HistoricoPage() {
  const [busca, setBusca] = useState('');
  const [tipoBusca, setTipoBusca] = useState<'cpf' | 'lote'>('cpf');
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [visitaSelecionada, setVisitaSelecionada] = useState<Visita | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  const handleBuscar = async () => {
    if (!busca) return;
    setBuscando(true);
    try {
      const condId = Number(import.meta.env.VITE_COND_ID) || 1;
      const filtros = tipoBusca === 'cpf' ? { cpf: busca } : { lote: busca };
      const dados = await getHistoricoVisitas(condId, filtros);
      setVisitas(dados);
      setVisitaSelecionada(null);
      setBuscaRealizada(true);
    } catch (error) {
      console.error('Erro ao buscar visitas:', error);
    } finally {
      setBuscando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleBuscar();
  };

  const statusVariant = (status: string): BadgeVariant => {
    if (status === 'ativa') return 'ativa';
    if (status === 'encerrada') return 'encerrada';
    if (status === 'pendente') return 'warning';
    return 'expirada';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Histórico de Visitas"
        subtitle="Consulte registros anteriores por CPF ou número de lote"
      />

      {/* Search Card */}
      <Card className="!p-0 overflow-hidden">
        <div className="p-4 sm:p-5 space-y-4">
          {/* Search type toggle */}
          <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
            {(['cpf', 'lote'] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setTipoBusca(tipo)}
                className={`px-5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
                  tipoBusca === tipo
                    ? 'bg-white dark:bg-gray-700 text-[#0B4F3A] dark:text-[#28b88d] shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {tipo === 'cpf' ? 'CPF' : 'Lote'}
              </button>
            ))}
          </div>

          {/* Search input + button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder={tipoBusca === 'cpf' ? 'Digite o CPF do visitante...' : 'Digite o número do lote...'}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={handleKeyDown}
                startIcon={<Search size={15} />}
              />
            </div>
            <Button onClick={handleBuscar} disabled={buscando || !busca}>
              <Search size={15} />
              {buscando ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </div>
      </Card>

      {buscaRealizada && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Results list */}
          <Card className="!p-0 overflow-hidden lg:col-span-2">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-gray-500" />
                <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wider">
                  Resultados
                </h3>
              </div>
              <Badge variant="neutral">{visitas.length} registro(s)</Badge>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {visitas.length === 0 ? (
                <EmptyState
                  icon={<Search size={20} />}
                  title="Nenhuma visita encontrada"
                  description="Tente outro CPF ou número de lote."
                />
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {visitas.map((visita) => {
                    const isSelected = visitaSelecionada?.id === visita.id;
                    return (
                      <button
                        key={visita.id}
                        onClick={() => setVisitaSelecionada(visita)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors ${
                          isSelected
                            ? 'bg-[#0B4F3A]/[0.04] dark:bg-[#28b88d]/[0.06] border-l-2 border-[#0B4F3A] dark:border-[#28b88d]'
                            : 'border-l-2 border-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold text-gray-900 dark:text-white font-mono truncate">
                              {mascararCPF(visita.cpf)}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <MapPin size={10} />
                                Q.{visita.quadra} L.{visita.lote}
                              </span>
                              <span className="text-gray-300 dark:text-gray-600">·</span>
                              <span className="font-mono">{visita.horario_entrada ? formatarHora(visita.horario_entrada) : '—'}</span>
                            </div>
                          </div>
                          <Badge variant={statusVariant(visita.status)} dot>
                            {visita.status}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Details */}
          <Card className="!p-0 overflow-hidden lg:col-span-3">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 flex items-center gap-2">
              <Eye size={13} className="text-gray-500" />
              <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wider">
                Detalhes da Visita
              </h3>
            </div>

            {!visitaSelecionada ? (
              <EmptyState
                icon={<Eye size={20} />}
                title="Selecione um registro"
                description="Clique em uma visita à esquerda para ver os detalhes completos."
              />
            ) : (
              <div className="p-5 space-y-3">
                <DetailRow icon={<Hash size={12} />} label="CPF" value={mascararCPF(visitaSelecionada.cpf)} mono />
                <DetailRow
                  icon={<MapPin size={12} />}
                  label="Destino"
                  value={`Quadra ${visitaSelecionada.quadra} — Lote ${visitaSelecionada.lote}`}
                />
                <DetailRow
                  icon={<Clock size={12} />}
                  label="Entrada"
                  value={visitaSelecionada.horario_entrada ? formatarHora(visitaSelecionada.horario_entrada) : '—'}
                  mono
                />
                <DetailRow
                  icon={<LogOut size={12} />}
                  label="Saída"
                  value={
                    visitaSelecionada.horario_saida
                      ? formatarHora(visitaSelecionada.horario_saida)
                      : '—'
                  }
                  mono={!!visitaSelecionada.horario_saida}
                />
                <DetailRow
                  icon={<Clock size={12} />}
                  label="Duração"
                  value={visitaSelecionada.duracao_minutos ? `${visitaSelecionada.duracao_minutos} min` : '—'}
                />
                <DetailRow
                  icon={<Compass size={12} />}
                  label="App de Navegação"
                  value={visitaSelecionada.app_navegacao || '—'}
                />
                <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                    <FileText size={12} />
                    <p className="text-[10px] font-bold uppercase tracking-wider">Status</p>
                  </div>
                  <Badge variant={statusVariant(visitaSelecionada.status)} dot>
                    {visitaSelecionada.status}
                  </Badge>
                </div>
                {visitaSelecionada.observacoes && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                      Observações
                    </p>
                    <p className="text-[12px] text-amber-800 dark:text-amber-200 leading-relaxed">
                      {visitaSelecionada.observacoes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {!buscaRealizada && (
        <Card>
          <EmptyState
            icon={<Search size={22} />}
            title="Nenhuma busca realizada"
            description="Use o campo acima para consultar o histórico de visitas por CPF ou lote."
          />
        </Card>
      )}
    </div>
  );
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}

function DetailRow({ icon, label, value, mono }: DetailRowProps) {
  return (
    <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-3 last:border-0">
      <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p
        className={`text-[12px] font-bold text-gray-900 dark:text-white text-right ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}
