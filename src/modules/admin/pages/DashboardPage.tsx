import { useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'motion/react';
import {
  Activity, Users, Clock, Building2,
  MapPin, Navigation, TrendingUp,
} from 'lucide-react';

import { Card, Badge, EmptyState, Loading, PageHeader } from '../../../shared/components';
import useVisitasStore from '../../../shared/store/visitasStore';
import { getHistoricoVisitas } from '../../../shared/services/visitaService';
import { calcularPermanencia, formatarHora } from '../../../shared/utils/tempo';
import { ocultarCPF } from '../../../shared/utils/cpf';

// ─── Palette ──────────────────────────────────────────────────────────────────
const CHART_COLORS = ['#0B4F3A', '#28b88d', '#4ade80', '#86efac'];

// ─── Custom chart tooltip ─────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.fill || p.color }}>
          {p.value} {p.name || 'visitas'}
        </p>
      ))}
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'brand' | 'blue' | 'red' | 'emerald';
  delay?: number;
  live?: boolean;
}

const colorMap = {
  brand:   { icon: 'bg-[#0B4F3A]/10 text-[#0B4F3A] dark:bg-[#28b88d]/10 dark:text-[#28b88d]', value: 'text-[#0B4F3A] dark:text-[#28b88d]' },
  blue:    { icon: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',           value: 'text-blue-600 dark:text-blue-400' },
  red:     { icon: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',               value: 'text-red-600 dark:text-red-400' },
  emerald: { icon: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', value: 'text-emerald-600 dark:text-emerald-400' },
};

function MetricCard({ label, value, icon, color, delay = 0, live = false }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
    >
      <Card className="p-5 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 truncate">
                {label}
              </p>
              {live && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              )}
            </div>
            <p className={`text-3xl font-black tabular-nums leading-none ${colorMap[color].value}`}>
              {value}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color].icon}`}>
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Duration cell ─────────────────────────────────────────────────────────
function DurationCell({ entrada }: { entrada: string }) {
  const text = calcularPermanencia(entrada);
  const mins = Math.floor((Date.now() - new Date(entrada).getTime()) / 60000);
  const color =
    mins < 30  ? 'text-green-600 dark:text-green-400' :
    mins < 60  ? 'text-amber-600 dark:text-amber-400' :
                 'text-red-600 dark:text-red-400';
  return <span className={`font-semibold tabular-nums ${color}`}>{text}</span>;
}

// ─── App label map ──────────────────────────────────────────────────────────
const APP_LABELS: Record<string, string> = {
  interno: 'Mapa Interno',
  gmaps:   'Google Maps',
  waze:    'Waze',
};

// ─── Page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { visitasAtivas, loading, startPolling, stopPolling } = useVisitasStore();

  const [metricas, setMetricas] = useState({
    visitasAtivas: 0,
    visitasHoje:   0,
    expiradas:     0,
    lotesAtivos:   150,
  });
  const [dadosQuadras, setDadosQuadras] = useState<{ quadra: string; visitas: number }[]>([]);
  const [dadosApps,   setDadosApps]    = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const condId = Number(import.meta.env.VITE_COND_ID) || 1;
    startPolling(condId, 30_000);
    return () => stopPolling();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const condId = Number(import.meta.env.VITE_COND_ID) || 1;
        const historico = await getHistoricoVisitas(condId);
        const hoje = new Date().toISOString().split('T')[0];
        const deHoje = historico.filter(v => v.horario_entrada.startsWith(hoje));

        setMetricas({
          visitasAtivas: visitasAtivas.length,
          visitasHoje:   deHoje.length || visitasAtivas.length,
          expiradas:     deHoje.filter(v => v.status === 'expirada').length,
          lotesAtivos:   150,
        });
      } catch {
        setMetricas(m => ({ ...m, visitasAtivas: visitasAtivas.length }));
      }
    };
    fetch();

    // ── Chart data from active visits ──
    const byQuadra = visitasAtivas.reduce((acc, v) => {
      acc[v.quadra] = (acc[v.quadra] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    setDadosQuadras(Object.entries(byQuadra).map(([quadra, visitas]) => ({ quadra, visitas })));

    const byApp = visitasAtivas.reduce((acc, v) => {
      const name = APP_LABELS[v.app_navegacao] ?? v.app_navegacao;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    setDadosApps(Object.entries(byApp).map(([name, value]) => ({ name, value })));
  }, [visitasAtivas]);

  if (loading && visitasAtivas.length === 0) {
    return <Loading label="Carregando dashboard..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Dashboard"
        subtitle="Monitoramento em tempo real do perímetro"
        action={
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
            <span className="text-[11px] font-semibold tracking-wide text-gray-700 dark:text-gray-300">
              Sistema Online
            </span>
          </div>
        }
      />

      {/* ── Metric cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Hero card — Visitas Ativas */}
        <motion.div
          className="sm:col-span-2 xl:col-span-1"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B4F3A] to-[#073627] p-5 h-full min-h-[100px] shadow-lg shadow-[#0B4F3A]/20">
            {/* dot grid */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
                backgroundSize: '20px 20px',
              }}
            />
            {/* deco circle */}
            <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/5" />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-200/70">
                    Visitas Ativas
                  </p>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                </div>
                <p className="text-4xl font-black text-white tabular-nums leading-none drop-shadow-md">
                  {metricas.visitasAtivas}
                </p>
                <p className="text-green-200/50 text-xs mt-2">em tempo real</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#28b88d]" />
              </div>
            </div>
          </div>
        </motion.div>

        <MetricCard
          label="Visitas Hoje"
          value={metricas.visitasHoje}
          icon={<Users className="w-5 h-5" />}
          color="blue"
          delay={0.05}
        />
        <MetricCard
          label="Expiradas"
          value={metricas.expiradas}
          icon={<Clock className="w-5 h-5" />}
          color="red"
          delay={0.1}
        />
        <MetricCard
          label="Lotes Ativos"
          value={metricas.lotesAtivos}
          icon={<Building2 className="w-5 h-5" />}
          color="emerald"
          delay={0.15}
        />
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Bar chart — Densidade por Quadra */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Densidade por Quadra
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Visitas ativas por setor
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#0B4F3A]/8 dark:bg-[#28b88d]/8 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#0B4F3A] dark:text-[#28b88d]" />
              </div>
            </div>

            <div className="p-4">
              {dadosQuadras.length === 0 ? (
                <EmptyState
                  icon={<TrendingUp className="w-5 h-5" />}
                  title="Sem dados de quadra"
                  description="Os dados aparecerão quando houver visitas ativas."
                  className="py-10"
                />
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dadosQuadras} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-5" vertical={false} />
                    <XAxis
                      dataKey="quadra"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      className="text-gray-500"
                      dy={4}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      className="text-gray-500"
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(11,79,58,0.05)', radius: 8 }} />
                    <Bar dataKey="visitas" radius={[6, 6, 4, 4]} maxBarSize={36}>
                      {dadosQuadras.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Donut chart — Distribuição de Apps */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.25 }}
        >
          <Card className="overflow-hidden h-full">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Apps Utilizados
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Modo de navegação
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#0B4F3A]/8 dark:bg-[#28b88d]/8 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-[#0B4F3A] dark:text-[#28b88d]" />
              </div>
            </div>

            <div className="p-4">
              {dadosApps.length === 0 ? (
                <EmptyState
                  icon={<Navigation className="w-5 h-5" />}
                  title="Sem dados"
                  className="py-10"
                />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={dadosApps}
                        cx="50%"
                        cy="50%"
                        outerRadius={58}
                        innerRadius={34}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {dadosApps.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="flex flex-col gap-1.5 mt-2">
                    {dadosApps.map((item, i) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <span className="text-gray-600 dark:text-gray-400 truncate">{item.name}</span>
                        </div>
                        <span className="font-bold text-gray-800 dark:text-gray-200 ml-2">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Realtime activity table ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
      >
        <Card className="overflow-hidden">
          {/* Table header */}
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0B4F3A]/8 dark:bg-[#28b88d]/8 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#0B4F3A] dark:text-[#28b88d]" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                  Atividade em Tempo Real
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Atualiza automaticamente a cada 30s
                </p>
              </div>
            </div>
            {visitasAtivas.length > 0 && (
              <Badge variant="ativa" dot>
                {visitasAtivas.length} ativa{visitasAtivas.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Table */}
          {visitasAtivas.length === 0 ? (
            <EmptyState
              icon={<Activity className="w-5 h-5" />}
              title="Nenhuma atividade detectada"
              description="Quando houver visitantes no perímetro, eles aparecerão aqui."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Identificação', 'Destino', 'Entrada', 'Duração', 'App', 'Status'].map(h => (
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
                  {visitasAtivas.map((visita, i) => (
                    <motion.tr
                      key={visita.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {ocultarCPF(visita.cpf)}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                          <MapPin className="w-3 h-3 opacity-60" />
                          Q.{visita.quadra} — L.{visita.lote}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                        {formatarHora(visita.horario_entrada)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs">
                        <DurationCell entrada={visita.horario_entrada} />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {APP_LABELS[visita.app_navegacao] ?? visita.app_navegacao}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Badge
                          variant={visita.status as 'ativa' | 'encerrada' | 'expirada'}
                          dot={visita.status === 'ativa'}
                        >
                          {visita.status}
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

    </div>
  );
}
