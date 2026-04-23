import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { iniciarVisita } from '../../../shared/services/visitaService';
import useConfigStore from '../../../shared/store/configStore';
import Button from '../../../shared/components/Button';
import { abrirGoogleMaps, abrirWaze } from '../../../shared/utils/navegacao';
import { Map, Navigation, Phone } from 'lucide-react';
import { useVisitanteStore } from '../../../shared/store/visitanteStore';

export default function TelaNavegacao() {
  const navigate = useNavigate();
  const { config, fetchConfig } = useConfigStore();
  const [registrando, setRegistrando] = useState(false);
  const { condId, quadraNome, loteNumero, loteId, cpf, loteLat, loteLon, setVisita } = useVisitanteStore();

  useEffect(() => {
    if (condId) {
      fetchConfig(condId);
    }
  }, []);

  const registrarVisita = async (tipoRota: string) => {
    setRegistrando(true);

    try {
      if (!cpf || !loteId || !condId) {
        throw new Error('Dados da sessão incompletos');
      }

      const visita = await iniciarVisita(
        cpf,
        loteId,
        condId,
        { tipo: tipoRota }
      );

      setVisita(visita.id, visita.horario_entrada);
    } catch (error: any) {
      console.error('Erro ao registrar visita:', error);
      alert('Erro ao registrar visita. Tente novamente.');
    } finally {
      setRegistrando(false);
    }
  };

  const handleMapaInterno = async () => {
    await registrarVisita('interno');
    navigate('/visitante/mapa');
  };

  const handleGoogleMaps = async () => {
    await registrarVisita('gmaps');
    abrirGoogleMaps(loteLat || 0, loteLon || 0);
  };

  const handleWaze = async () => {
    await registrarVisita('waze');
    abrirWaze(loteLat || 0, loteLon || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      <div className="max-w-md mx-auto flex-1 flex flex-col">
        <button
          onClick={() => navigate(-1)}
          className="text-[#0B4F3A] mb-4 hover:underline self-start"
        >
          ← Voltar
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl mb-2">Destino Selecionado</h1>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <p className="text-xl">
              Quadra <strong>{quadraNome}</strong> - Lote <strong>{loteNumero}</strong>
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-4">
          <p className="text-center text-gray-600 mb-2">
            Escolha como deseja navegar:
          </p>

          {config?.mapa_interno_ativo && (
            <Button
              onClick={handleMapaInterno}
              disabled={registrando}
              className="w-full flex items-center justify-center gap-3 text-lg py-6"
            >
              <Map size={24} />
              Mapa Interno
            </Button>
          )}

          {config?.google_maps_ativo && (
            <Button
              onClick={handleGoogleMaps}
              disabled={registrando}
              variant="secondary"
              className="w-full flex items-center justify-center gap-3 text-lg py-6"
            >
              <Navigation size={24} />
              Google Maps
            </Button>
          )}

          {config?.waze_ativo && (
            <Button
              onClick={handleWaze}
              disabled={registrando}
              variant="secondary"
              className="w-full flex items-center justify-center gap-3 text-lg py-6"
            >
              <Navigation size={24} />
              Waze
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
