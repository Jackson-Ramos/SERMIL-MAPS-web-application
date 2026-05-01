import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getLotesPublico } from '../../../shared/services/publicService';
import { Lote } from '../../../shared/types';
import Loading from '../../../shared/components/Loading';
import { useVisitanteStore } from '../../../shared/store/visitanteStore';
import VisitanteLayout from '../VisitanteLayout';
import { AlertCircle, RotateCcw, User } from 'lucide-react';
import { motion } from 'motion/react';
import Button from '../../../shared/components/Button';

export default function TelaLotes() {
  const navigate = useNavigate();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const { quadraNome, quadraId, setLote } = useVisitanteStore();

  useEffect(() => {
    carregarLotes();
  }, []);

  const carregarLotes = async () => {
    setLoading(true);
    setErro('');

    if (!quadraId) {
      setErro('Sessão expirada. Escaneie o QR Code novamente.');
      setLoading(false);
      return;
    }

    try {
      const dados = await getLotesPublico(quadraId);
      setLotes(dados);
    } catch (error: any) {
      setErro(error.message || 'Erro ao carregar lotes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarLote = (lote: Lote) => {
    setLote(
      lote.id,
      lote.numero,
      lote.nome_morador || null,
      lote.ramal || null,
      lote.latitude || null,
      lote.longitude || null,
    );
    navigate('/visitante/navegacao');
  };

  return (
    <VisitanteLayout
      showBack
      titulo={`Quadra ${quadraNome}`}
      subtitulo="Selecione o número do lote de destino"
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
            <p className="font-semibold text-gray-800 dark:text-gray-200">{erro}</p>
            <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={13} />} onClick={carregarLotes}>
              Tentar novamente
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Legenda */}
            <div className="flex items-center gap-4 mb-4 px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#0B4F3A] dark:bg-[#28b88d]" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Com morador</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Vazio</span>
              </div>
            </div>

            {/* Grid de lotes */}
            <div className="grid grid-cols-3 gap-2.5">
              {lotes.map((lote, i) => {
                const temMorador = Boolean(lote.nome_morador);
                return (
                  <motion.button
                    key={lote.id}
                    onClick={() => handleSelecionarLote(lote)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`
                      relative flex flex-col items-center justify-center rounded-2xl border-2
                      min-h-[76px] py-2.5 px-1 gap-1
                      active:scale-95 transition-all duration-150
                      ${temMorador
                        ? 'border-[#0B4F3A]/30 dark:border-[#28b88d]/30 bg-[#0B4F3A]/5 dark:bg-[#28b88d]/5 hover:border-[#0B4F3A]/60 dark:hover:border-[#28b88d]/60 hover:bg-[#0B4F3A]/10 dark:hover:bg-[#28b88d]/10'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                      }
                    `}
                  >
                    <span className={`text-lg font-bold leading-none ${
                      temMorador
                        ? 'text-[#0B4F3A] dark:text-[#28b88d]'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {lote.numero}
                    </span>

                    {temMorador ? (
                      <>
                        <div className="flex items-center gap-0.5">
                          <User size={9} className="text-[#0B4F3A]/60 dark:text-[#28b88d]/60" />
                          <span className="text-[9px] text-[#0B4F3A]/70 dark:text-[#28b88d]/70 font-semibold truncate max-w-[56px]">
                            {lote.nome_morador!.split(' ')[0]}
                          </span>
                        </div>
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#0B4F3A] dark:bg-[#28b88d]" />
                      </>
                    ) : (
                      <span className="text-[9px] text-gray-400 dark:text-gray-600 font-medium">
                        Vazio
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </VisitanteLayout>
  );
}
