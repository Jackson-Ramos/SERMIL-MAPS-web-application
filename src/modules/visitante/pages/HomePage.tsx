import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { MapPin, ShieldCheck, QrCode, ArrowRight, Smartphone } from 'lucide-react';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';
import Card from '../../../shared/components/Card';
import ThemeToggle from '../../../shared/components/ThemeToggle';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 transition-colors relative">

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        className="max-w-3xl w-full"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Card variant="elevated" className="overflow-hidden">
          {/* Brand accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-[#0B4F3A] to-[#28b88d]" />

          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                className="mx-auto w-16 h-16 bg-[#0B4F3A] rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <MapPin size={30} className="text-white" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Badge variant="brand" dot className="mb-4">
                  Sistema Ativo
                </Badge>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                  SERMIL MAPS
                </h1>
                <p className="text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Plataforma inteligente de navegação interna e controle de acesso para condomínios.
                </p>
              </motion.div>
            </div>

            {/* Access cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card variant="flat" className="h-full p-6">
                  <div className="w-10 h-10 rounded-xl bg-[#0B4F3A]/10 dark:bg-[#28b88d]/10 flex items-center justify-center mb-4">
                    <ShieldCheck size={20} className="text-[#0B4F3A] dark:text-[#28b88d]" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    Administração & Portaria
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                    Gerencie visitas, moradores e lotes. Gere QR Codes de acesso e monitore o fluxo do condomínio.
                  </p>
                  <Button
                    onClick={() => navigate('/login')}
                    size="md"
                    className="w-full"
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Acessar Painel
                  </Button>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Card variant="flat" className="h-full p-6">
                  <div className="w-10 h-10 rounded-xl bg-[#0B4F3A]/10 dark:bg-[#28b88d]/10 flex items-center justify-center mb-4">
                    <QrCode size={20} className="text-[#0B4F3A] dark:text-[#28b88d]" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    Visitantes
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                    Aponte a câmera do seu celular para o QR Code fornecido pelo morador ou na entrada do condomínio.
                  </p>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0B4F3A]/5 dark:bg-[#28b88d]/5 border border-[#0B4F3A]/10 dark:border-[#28b88d]/10">
                    <Smartphone size={15} className="text-[#0B4F3A] dark:text-[#28b88d] shrink-0" />
                    <span className="text-xs font-medium text-[#0B4F3A] dark:text-[#28b88d]">
                      Acesso exclusivo via QR Code
                    </span>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Footer */}
            <motion.div
              className="text-center border-t border-gray-100 dark:border-gray-800 pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <p className="text-xs text-gray-400 dark:text-gray-500">
                &copy; {new Date().getFullYear()} SERMIL MAPS. Todos os direitos reservados.
              </p>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
