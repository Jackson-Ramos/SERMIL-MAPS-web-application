import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { iniciarVisita } from '../../../shared/services/visitaService';
import useConfigStore from '../../../shared/store/configStore';
import { abrirGoogleMaps, abrirWaze } from '../../../shared/utils/navegacao';
import { MapPin, Map, Navigation2, AlertCircle, ChevronRight, Phone, User } from 'lucide-react';
import { useVisitanteStore } from '../../../shared/store/visitanteStore';
import VisitanteLayout from '../VisitanteLayout';
import { motion } from 'motion/react';

interface NavOption {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
  handler: () => void;
  enabled: boolean;
}

export default function TelaNavegacao() {
  const navigate = useNavigate();
  const { config, fetchConfig } = useConfigStore();
  const [registrando, setRegistrando] = useState(false);
  const [erro, setErro] = useState('');
  const { condId, quadraNome, loteNumero, loteId, cpf, loteLat, loteLon, loteMorador, loteRamal, visitaId, setVisita } =
    useVisitanteStore();

  useEffect(() => {
    if (condId) fetchConfig(condId);
  }, []);

  const registrarVisita = async (tipoRota: string) => {
    setRegistrando(true);
    setErro('');
    try {
      if (!cpf || !loteId || !condId) throw new Error('Dados da sessão incompletos');
      if (visitaId) return;
      const visita = await iniciarVisita(cpf, loteId, condId, { tipo: tipoRota }, quadraNome || '', loteNumero || '');
      setVisita(visita.id, visita.horario_entrada);
    } catch (error: any) {
      setErro('Erro ao registrar visita. Tente novamente.');
      throw error;
    } finally {
      setRegistrando(false);
    }
  };

  const handleMapaInterno = async () => {
    try { await registrarVisita('interno'); navigate('/visitante/mapa'); } catch {}
  };

  const handleGoogleMaps = async () => {
    try { await registrarVisita('gmaps'); abrirGoogleMaps(loteLat || 0, loteLon || 0); } catch {}
  };

  const handleWaze = async () => {
    try { await registrarVisita('waze'); abrirWaze(loteLat || 0, loteLon || 0); } catch {}
  };

  const opcoes: NavOption[] = [
    {
      id: 'interno',
      label: 'Mapa Interno',
      desc: 'Navegue pelo mapa do condomínio',
      icon: <Map size={22} />,
      accent: 'bg-[#0B4F3A]/8 dark:bg-[#28b88d]/10 text-[#0B4F3A] dark:text-[#28b88d] border-[#0B4F3A]/20 dark:border-[#28b88d]/20',
      handler: handleMapaInterno,
      enabled: Boolean(config?.mapa_interno_ativo),
    },
    {
      id: 'gmaps',
      label: 'Google Maps',
      desc: 'Abre no aplicativo Google Maps',
      icon: <Navigation2 size={22} />,
      accent: 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30',
      handler: handleGoogleMaps,
      enabled: Boolean(config?.google_maps_ativo),
    },
    {
      id: 'waze',
      label: 'Waze',
      desc: 'Abre no aplicativo Waze',
      icon: <Navigation2 size={22} />,
      accent: 'bg-sky-50 dark:bg-sky-900/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/30',
      handler: handleWaze,
      enabled: Boolean(config?.waze_ativo),
    },
  ].filter((o) => o.enabled);

  return (
    <VisitanteLayout showBack titulo="Escolha a navegação">
      <div className="p-4 max-w-sm mx-auto space-y-4 py-6">
        {/* Destination card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0B4F3A]/10 dark:bg-[#28b88d]/10 flex items-center justify-center shrink-0">
            <MapPin size={18} className="text-[#0B4F3A] dark:text-[#28b88d]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Destino selecionado
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
              Quadra <span className="text-[#0B4F3A] dark:text-[#28b88d]">{quadraNome}</span>
              {' · '}
              Lote <span className="text-[#0B4F3A] dark:text-[#28b88d]">{loteNumero}</span>
            </p>
          </div>
        </motion.div>

        {/* Card de contato com o morador (se houver ramal cadastrado) */}
        {loteRamal && (
          <motion.a
            href={`tel:${loteRamal}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="block bg-white dark:bg-gray-900 rounded-2xl border border-[#0B4F3A]/15 dark:border-[#28b88d]/20 shadow-sm p-4 hover:border-[#0B4F3A]/40 dark:hover:border-[#28b88d]/40 hover:shadow-md active:scale-[0.98] transition-all duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#0B4F3A] dark:bg-[#28b88d] flex items-center justify-center shrink-0 shadow-sm">
                <Phone size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Ligar para o morador
                </p>
                {loteMorador ? (
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-1.5 mt-0.5">
                    <User size={12} className="text-[#0B4F3A] dark:text-[#28b88d] shrink-0" />
                    {loteMorador}
                  </p>
                ) : (
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                    Ramal do destino
                  </p>
                )}
                <p className="text-[12px] font-mono font-bold text-[#0B4F3A] dark:text-[#28b88d] mt-0.5">
                  {loteRamal}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
            </div>
          </motion.a>
        )}

        {/* Nav options */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">
            Como deseja navegar?
          </p>

          {opcoes.length === 0 ? (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 text-center">
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                Nenhuma opção de navegação disponível no momento.
              </p>
            </div>
          ) : (
            opcoes.map((op, i) => (
              <motion.button
                key={op.id}
                onClick={op.handler}
                disabled={registrando}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-2xl border-2
                  ${op.accent}
                  hover:shadow-md active:scale-[0.98] transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed text-left
                `}
              >
                <div className="w-11 h-11 rounded-xl bg-white/60 dark:bg-black/20 flex items-center justify-center shrink-0">
                  {op.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{op.label}</p>
                  <p className="text-[11px] opacity-70 mt-0.5">{op.desc}</p>
                </div>
                <ChevronRight size={16} className="opacity-40 shrink-0" />
              </motion.button>
            ))
          )}
        </div>

        {erro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30"
          >
            <AlertCircle size={14} className="text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-[12px] font-medium text-red-700 dark:text-red-300">{erro}</p>
          </motion.div>
        )}
      </div>
    </VisitanteLayout>
  );
}
