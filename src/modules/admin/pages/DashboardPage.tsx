import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../../../shared/components/Card';
import Loading from '../../../shared/components/Loading';
import useVisitasStore from '../../../shared/store/visitasStore';
import { getHistoricoVisitas } from '../../../shared/services/visitaService';
import { calcularPermanencia, formatarHora } from '../../../shared/utils/tempo';
import { ocultarCPF } from '../../../shared/utils/cpf';

const COLORS = ['#0B4F3A', '#4CAF50', '#8BC34A'];

export default function DashboardPage() {
  const { visitasAtivas, loading, startPolling, stopPolling } = useVisitasStore();
  const [metricas, setMetricas] = useState({
    visitasAtivas: 0,
    visitasHoje: 0,
    visitasExpiradas: 0,
    lotesCadastrados: 0,
  });
  const [dadosQuadras, setDadosQuadras] = useState<{quadra: string, visitas: number}[]>([]);
  const [dadosApps, setDadosApps] = useState<{name: string, value: number}[]>([]);

  useEffect(() => {
    const condId = Number(import.meta.env.VITE_COND_ID) || 1;
    startPolling(condId, 30000);

    return () => {
      stopPolling();
    };
  }, []);

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        const condId = Number(import.meta.env.VITE_COND_ID) || 1;
        const historicoData = await getHistoricoVisitas(condId);
        
        const hoje = new Date().toISOString().split('T')[0];
        const visitasDeHoje = historicoData.filter(v => v.horario_entrada.startsWith(hoje));

        setMetricas({
          visitasAtivas: visitasAtivas.length,
          visitasHoje: visitasDeHoje.length > 0 ? visitasDeHoje.length : visitasAtivas.length,
          visitasExpiradas: visitasDeHoje.filter((v) => v.status === 'expirada').length,
          lotesCadastrados: 150,
        });
      } catch (error) {
        console.error(error);
        setMetricas({
          visitasAtivas: visitasAtivas.length,
          visitasHoje: visitasAtivas.length,
          visitasExpiradas: 0,
          lotesCadastrados: 150,
        });
      }
    };

    fetchHistorico();

    const quadrasCount = visitasAtivas.reduce((acc, v) => {
      acc[v.quadra] = (acc[v.quadra] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    setDadosQuadras(
      Object.entries(quadrasCount).map(([quadra, visitas]) => ({ quadra, visitas }))
    );

    const appsCount = visitasAtivas.reduce((acc, v) => {
      const app = v.app_navegacao === 'gmaps' ? 'Google Maps' : v.app_navegacao === 'waze' ? 'Waze' : 'Mapa Interno';
      acc[app] = (acc[app] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setDadosApps(
      Object.entries(appsCount).map(([name, value]) => ({ name, value }))
    );
  }, [visitasAtivas]);

  if (loading && visitasAtivas.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Sec */}
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-[11px] font-medium text-gray-500 mt-0.5">Visão Geral do Perímetro e Acessos</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          <span className="text-[10px] font-semibold tracking-wide text-gray-800 dark:text-gray-200">Sistema Online</span>
        </div>
      </header>

      {/* Top Metrics Row - Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Metric */}
        <Card className="!rounded-2xl border-0 bg-gradient-to-br from-[#0B4F3A] to-[#073627] shadow-lg shadow-[#0B4F3A]/20 text-white p-4 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 flex items-center justify-between">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-green-500/10 blur-2xl rounded-full"></div>
          
          <div className="relative z-10">
            <p className="text-[10px] font-semibold text-green-100/80 tracking-wider mb-1">VISITAS ATIVAS</p>
            <p className="text-4xl font-black tracking-tight leading-none text-white drop-shadow-md">{metricas.visitasAtivas}</p>
          </div>
          
          <div className="relative z-10 w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
             <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]"></span>
          </div>
        </Card>

        {/* Secondary Metrics */}
        <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md dark:bg-gray-800/80 backdrop-blur-sm transition-all duration-300 p-4 flex items-center gap-4 group">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div>
             <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Visitas Hoje</p>
             <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">{metricas.visitasHoje}</p>
          </div>
        </Card>
        
        <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md dark:bg-gray-800/80 backdrop-blur-sm transition-all duration-300 p-4 flex items-center gap-4 group">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
             <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Expiradas</p>
             <p className="text-2xl font-extrabold text-red-600 mt-0.5">{metricas.visitasExpiradas}</p>
          </div>
        </Card>
        
        <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md dark:bg-gray-800/80 backdrop-blur-sm transition-all duration-300 p-4 flex items-center gap-4 group">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
             <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Lotes Ativos</p>
             <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">{metricas.lotesCadastrados}</p>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden flex flex-col">
          <div className="py-2.5 px-4 border-b border-gray-50 dark:border-gray-800 bg-white dark:bg-gray-800/50">
            <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wide">Densidade por Quadra</h3>
          </div>
          <div className="p-2 flex-1 bg-gray-50/30 dark:bg-gray-900/10">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dadosQuadras} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.5} />
                <XAxis dataKey="quadra" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={4} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(11, 79, 58, 0.05)', rx: 6 }} 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: 600, fontSize: 11, padding: '4px 8px' }} 
                />
                <Bar dataKey="visitas" fill="#0B4F3A" radius={[4, 4, 4, 4]} barSize={20}>
                  {dadosQuadras.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden flex flex-col">
          <div className="py-2.5 px-4 border-b border-gray-50 dark:border-gray-800 bg-white dark:bg-gray-800/50">
            <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wide">Distribuição de Apps</h3>
          </div>
          <div className="p-2 flex-1 flex items-center justify-center bg-gray-50/30 dark:bg-gray-900/10">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={dadosApps}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.value})`}
                  outerRadius={60}
                  innerRadius={35}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {dadosApps.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: 600, fontSize: 11, padding: '4px 8px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Realtime Table Section */}
      <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden">
        <div className="py-3 px-4 border-b border-gray-50 dark:border-gray-800 bg-white dark:bg-gray-800/80 flex justify-between items-center">
          <h3 className="text-[11px] font-bold uppercase text-gray-800 dark:text-gray-200 tracking-wide flex items-center gap-2">
            Atividade em Tempo Real
          </h3>
        </div>
        
        <div className="overflow-x-auto bg-white dark:bg-gray-900">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-2 px-4">Identificação</th>
                <th className="py-2 px-4">Destino</th>
                <th className="py-2 px-4">Entrada</th>
                <th className="py-2 px-4">Duração</th>
                <th className="py-2 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-gray-700 dark:text-gray-300">
              {visitasAtivas.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="py-6 text-center text-gray-400 dark:text-gray-500 font-medium text-[11px]">
                     Nenhuma atividade detectada no perímetro.
                   </td>
                 </tr>
              ) : (
                visitasAtivas.map((visita) => (
                  <tr key={visita.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-2 px-4 font-medium text-gray-900 dark:text-gray-100">{ocultarCPF(visita.cpf)}</td>
                    <td className="py-2 px-4">
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                        Q.{visita.quadra} - L.{visita.lote}
                      </span>
                    </td>
                    <td className="py-2 px-4">{formatarHora(visita.horario_entrada)}</td>
                    <td className="py-2 px-4 font-medium">{calcularPermanencia(visita.horario_entrada)}</td>
                    <td className="py-2 px-4 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 ${visita.status === 'ativa' ? 'bg-green-500 animate-pulse' : 'bg-red-500'} rounded-full shadow-sm`}></span>
                      <span className={`px-2 py-0.5 rounded-full font-bold tracking-wide ${
                          visita.status === 'ativa'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {visita.status === 'ativa' ? 'ATIVA' : 'EXPIRADA'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
