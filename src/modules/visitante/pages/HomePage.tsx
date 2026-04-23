import { useNavigate } from 'react-router';
import Button from '../../../shared/components/Button';
import { MapPin, ShieldCheck, QrCode } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 transition-colors">
      <div className="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-10 overflow-hidden relative">
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0B4F3A] to-[#28b88d]"></div>
        
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-[#0B4F3A] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <MapPin size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            SERMIL MAPS
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
            Plataforma Inteligente de Navegação Interna e Controle de Acesso para Condomínios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-100 dark:border-gray-600">
            <ShieldCheck size={28} className="text-[#0B4F3A] dark:text-[#28b88d] mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Administração & Portaria</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Acesse o painel restrito para gerenciar visitas, moradores, lotes e gerar QR Codes de acesso.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Acessar Painel
            </Button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-100 dark:border-gray-600">
            <QrCode size={28} className="text-[#0B4F3A] dark:text-[#28b88d] mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Visitantes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Para iniciar a navegação até o lote, aponte a câmera do seu celular para o QR Code fornecido pelo morador ou na entrada do condomínio.
            </p>
            <div className="p-3 bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-600 rounded-lg text-sm text-green-800 dark:text-green-400 text-center">
              Acesso exclusivo via QR Code
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-6">
          &copy; {new Date().getFullYear()} SERMIL MAPS. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
