import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { encerrarVisita } from '../../../shared/services/visitaService';
import { calcularPermanencia, formatarHora } from '../../../shared/utils/tempo';
import { CheckCircle2, MapPin, Clock, Timer, Map } from 'lucide-react';
import { useVisitanteStore } from '../../../shared/store/visitanteStore';
import VisitanteLayout from '../VisitanteLayout';
import Button from '../../../shared/components/Button';
import { motion, AnimatePresence } from 'motion/react';

export default function TelaChegada() {
  const navigate = useNavigate();
  const [encerrando, setEncerrando] = useState(false);
  const [encerrado, setEncerrado] = useState(false);
  const { quadraNome, loteNumero, horarioEntrada, visitaId, clear } = useVisitanteStore();

  useEffect(() => {
    document.addEventListener('visibilitychange', () => {});
    return () => document.removeEventListener('visibilitychange', () => {});
  }, []);

  const handleEncerrar = async () => {
    if (!visitaId) return;
    setEncerrando(true);
    try {
      await encerrarVisita(visitaId);
      setEncerrado(true);
      setTimeout(() => {
        clear();
        navigate('/', { replace: true });
      }, 2500);
    } catch {
      alert('Erro ao encerrar visita. Tente novamente.');
      setEncerrando(false);
    }
  };

  return (
    <VisitanteLayout titulo="Confirmação de chegada">
      <div className="p-4 max-w-sm mx-auto space-y-5 py-6">
        {/* Success icon */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        >
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle2 size={44} className="text-green-600 dark:text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chegou ao destino?</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Confirme a chegada para encerrar sua visita.
          </p>
        </motion.div>

        {/* Summary card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 flex items-center gap-2">
            <MapPin size={13} className="text-[#0B4F3A] dark:text-[#28b88d]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Resumo da visita
            </span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0B4F3A]/8 dark:bg-[#28b88d]/10 flex items-center justify-center shrink-0">
                <MapPin size={14} className="text-[#0B4F3A] dark:text-[#28b88d]" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Destino</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Quadra {quadraNome} · Lote {loteNumero}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0B4F3A]/8 dark:bg-[#28b88d]/10 flex items-center justify-center shrink-0">
                <Clock size={14} className="text-[#0B4F3A] dark:text-[#28b88d]" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Entrada</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                  {formatarHora(horarioEntrada || null)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0B4F3A]/8 dark:bg-[#28b88d]/10 flex items-center justify-center shrink-0">
                <Timer size={14} className="text-[#0B4F3A] dark:text-[#28b88d]" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Permanência</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {calcularPermanencia(horarioEntrada || null)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <Button
            onClick={handleEncerrar}
            disabled={encerrando || encerrado}
            loading={encerrando}
            size="lg"
            className="w-full"
          >
            <CheckCircle2 size={16} />
            {encerrando ? 'Encerrando...' : 'Cheguei — Encerrar visita'}
          </Button>

          <Button
            onClick={() => navigate('/visitante/mapa')}
            variant="secondary"
            size="lg"
            className="w-full"
            leftIcon={<Map size={16} />}
          >
            Ainda estou navegando
          </Button>
        </motion.div>
      </div>

      {/* Full-screen success overlay */}
      <AnimatePresence>
        {encerrado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0B4F3A]/95 backdrop-blur-sm flex flex-col items-center justify-center gap-5 px-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center"
            >
              <CheckCircle2 size={44} className="text-white" />
            </motion.div>
            <div>
              <p className="text-xl font-bold text-white">Visita encerrada!</p>
              <p className="text-white/70 text-sm mt-1">Obrigado por utilizar o SERMIL MAPS.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </VisitanteLayout>
  );
}
