import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getQuadras } from '../../../shared/services/quadraService';
import { Quadra } from '../../../shared/types';
import Loading from '../../../shared/components/Loading';
import { useVisitanteStore } from '../../../shared/store/visitanteStore';
import VisitanteLayout from '../VisitanteLayout';
import { ChevronRight, LayoutGrid, AlertCircle, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import Button from '../../../shared/components/Button';

export default function TelaQuadras() {
  const navigate = useNavigate();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const { condId, setQuadra } = useVisitanteStore();

  useEffect(() => {
    carregarQuadras();
  }, []);

  const carregarQuadras = async () => {
    setLoading(true);
    setErro('');

    if (!condId) {
      setErro('Sessão expirada. Escaneie o QR Code novamente.');
      setLoading(false);
      return;
    }

    try {
      const dados = await getQuadras(condId);
      setQuadras(dados);
    } catch (error: any) {
      setErro(error.message || 'Erro ao carregar quadras');
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarQuadra = (quadra: Quadra) => {
    setQuadra(quadra.id, quadra.nome);
    navigate('/visitante/lotes');
  };

  return (
    <VisitanteLayout
      showBack
      titulo="Selecione a Quadra"
      subtitulo="Escolha a quadra do seu destino"
    >
      <div className="p-4 max-w-sm mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loading />
          </div>
        ) : erro ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-12 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{erro}</p>
            </div>
            <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={13} />} onClick={carregarQuadras}>
              Tentar novamente
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-[#0B4F3A]/10 dark:bg-[#28b88d]/10 flex items-center justify-center">
                <LayoutGrid size={14} className="text-[#0B4F3A] dark:text-[#28b88d]" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {quadras.length} quadra{quadras.length !== 1 ? 's' : ''} disponível{quadras.length !== 1 ? 'is' : ''}
              </span>
            </div>

            {quadras.map((quadra, i) => (
              <motion.button
                key={quadra.id}
                onClick={() => handleSelecionarQuadra(quadra)}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-[#0B4F3A]/40 dark:hover:border-[#28b88d]/40 hover:shadow-md active:scale-[0.98] transition-all duration-150 text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B4F3A]/8 dark:bg-[#28b88d]/10 flex items-center justify-center shrink-0 group-hover:bg-[#0B4F3A]/15 dark:group-hover:bg-[#28b88d]/20 transition-colors">
                    <span className="text-base font-bold text-[#0B4F3A] dark:text-[#28b88d]">
                      {quadra.nome}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      Quadra {quadra.nome}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      Toque para selecionar
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-[#0B4F3A] dark:group-hover:text-[#28b88d] transition-colors" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </VisitanteLayout>
  );
}
