import { useEffect, useState } from 'react';
import { Clock, MapPin, LogOut, Compass, FileText, User } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../../../shared/components/Card';
import Badge, { BadgeVariant } from '../../../shared/components/Badge';
import EmptyState from '../../../shared/components/EmptyState';
import PageHeader from '../../../shared/components/PageHeader';
import { Visita } from '../../../shared/types';
import { getHistoricoMorador } from '../../../shared/services/agendamentoService';
import { mascararCPF } from '../../../shared/utils/cpf';
import { formatarHora } from '../../../shared/utils/tempo';

const statusVariant = (status: string): BadgeVariant => {
  if (status === 'ativa') return 'ativa';
  if (status === 'encerrada') return 'encerrada';
  if (status === 'pendente') return 'warning';
  return 'expirada';
};

export default function MoradorHistoricoPage() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [selecionada, setSelecionada] = useState<Visita | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const dados = await getHistoricoMorador(100);
        setVisitas(dados);
      } catch (e: any) {
        toast.error(e.message || 'Erro ao carregar histórico');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Histórico de Visitantes"
        subtitle="Visitantes que já passaram pelo seu lote"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="!p-0 overflow-hidden lg:col-span-2">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText size={13} className="text-gray-500" />
              <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wider">
                Visitas
              </h3>
            </div>
            <Badge variant="neutral">{visitas.length}</Badge>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-500">Carregando...</div>
            ) : visitas.length === 0 ? (
              <EmptyState
                icon={<Clock size={20} />}
                title="Sem visitas registradas"
                description="Quando você receber visitantes, eles aparecerão aqui."
              />
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {visitas.map((v) => {
                  const isSelected = selecionada?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelecionada(v)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors ${
                        isSelected
                          ? 'bg-[#0B4F3A]/[0.04] dark:bg-[#28b88d]/[0.06] border-l-2 border-[#0B4F3A] dark:border-[#28b88d]'
                          : 'border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-gray-900 dark:text-white truncate">
                            {v.nome_visitante || mascararCPF(v.cpf)}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                            <span className="font-mono">
                              {v.horario_entrada ? formatarHora(v.horario_entrada) : '—'}
                            </span>
                          </div>
                        </div>
                        <Badge variant={statusVariant(v.status)} dot>
                          {v.status}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card className="!p-0 overflow-hidden lg:col-span-3">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 flex items-center gap-2">
            <Clock size={13} className="text-gray-500" />
            <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wider">
              Detalhes
            </h3>
          </div>

          {!selecionada ? (
            <EmptyState
              icon={<Clock size={20} />}
              title="Selecione uma visita"
              description="Clique em uma visita à esquerda para ver os detalhes."
            />
          ) : (
            <div className="p-5 space-y-3">
              {selecionada.nome_visitante && (
                <Row icon={<User size={12} />} label="Visitante" value={selecionada.nome_visitante} />
              )}
              <Row icon={<FileText size={12} />} label="CPF" value={mascararCPF(selecionada.cpf)} mono />
              <Row
                icon={<MapPin size={12} />}
                label="Destino"
                value={`Quadra ${selecionada.quadra} — Lote ${selecionada.lote}`}
              />
              <Row
                icon={<Clock size={12} />}
                label="Entrada"
                value={selecionada.horario_entrada ? formatarHora(selecionada.horario_entrada) : '—'}
                mono={!!selecionada.horario_entrada}
              />
              <Row
                icon={<LogOut size={12} />}
                label="Saída"
                value={selecionada.horario_saida ? formatarHora(selecionada.horario_saida) : '—'}
                mono={!!selecionada.horario_saida}
              />
              <Row
                icon={<Clock size={12} />}
                label="Duração"
                value={selecionada.duracao_minutos ? `${selecionada.duracao_minutos} min` : '—'}
              />
              <Row icon={<Compass size={12} />} label="App" value={selecionada.app_navegacao || '—'} />
              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                  <FileText size={12} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Status</p>
                </div>
                <Badge variant={statusVariant(selecionada.status)} dot>
                  {selecionada.status}
                </Badge>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

interface RowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}

function Row({ icon, label, value, mono }: RowProps) {
  return (
    <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-3 last:border-0">
      <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-[12px] font-bold text-gray-900 dark:text-white text-right ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}
