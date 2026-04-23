import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { encerrarVisita } from '../../../shared/services/visitaService';
import Button from '../../../shared/components/Button';
import { calcularPermanencia, formatarHora } from '../../../shared/utils/tempo';
import { CheckCircle } from 'lucide-react';
import { useVisitanteStore } from '../../../shared/store/visitanteStore';

export default function TelaChegada() {
  const navigate = useNavigate();
  const [encerrando, setEncerrando] = useState(false);
  const { quadraNome, loteNumero, horarioEntrada, visitaId, clear } = useVisitanteStore();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Usuário retornou ao app');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleEncerrar = async () => {
    if (!visitaId) {
      alert('Erro: ID da visita não encontrado');
      return;
    }

    setEncerrando(true);
    try {
      await encerrarVisita(visitaId);

      clear();

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao encerrar visita:', error);
      alert('Erro ao encerrar visita. Tente novamente.');
      setEncerrando(false);
    }
  };

  const handleContinuar = () => {
    navigate('/visitante/mapa');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl mb-2">Você chegou ao destino?</h1>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          <p className="text-center mb-4">
            <strong>Destino:</strong> Quadra {quadraNome} - Lote {loteNumero}
          </p>
          <div className="border-t pt-4 space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Horário de Entrada:</strong>{' '}
              {formatarHora(horarioEntrada || '')}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Tempo Decorrido:</strong>{' '}
              {calcularPermanencia(horarioEntrada || '')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleEncerrar}
            disabled={encerrando}
            className="w-full text-lg py-6"
          >
            {encerrando ? 'Encerrando...' : 'Cheguei - Encerrar Visita'}
          </Button>

          <Button
            onClick={handleContinuar}
            variant="secondary"
            className="w-full text-lg py-6"
          >
            Ainda estou navegando
          </Button>
        </div>

        {encerrando && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
              <p className="text-xl">Visita encerrada com sucesso!</p>
              <p className="text-sm text-gray-600 mt-2">
                Obrigado por utilizar o SERMIL MAPS
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
