import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { Phone, MapPin } from 'lucide-react';
import Button from '../../../shared/components/Button';
import L from 'leaflet';
import { useVisitanteStore } from '../../../shared/store/visitanteStore';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 16);
  }, [center, map]);

  return null;
}

export default function TelaMapa() {
  const [posicaoAtual, setPosicaoAtual] = useState<[number, number] | null>(null);
  const [ramalVisivel, setRamalVisivel] = useState(false);
  const { loteLat, loteLon, loteMorador, loteRamal, quadraNome, loteNumero } = useVisitanteStore();

  const destino: [number, number] = [loteLat || -15.7801, loteLon || -47.9292];

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setPosicaoAtual([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, []);

  const calcularDistancia = () => {
    if (!posicaoAtual) return null;

    const R = 6371e3;
    const φ1 = (posicaoAtual[0] * Math.PI) / 180;
    const φ2 = (destino[0] * Math.PI) / 180;
    const Δφ = ((destino[0] - posicaoAtual[0]) * Math.PI) / 180;
    const Δλ = ((destino[1] - posicaoAtual[1]) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  const distancia = calcularDistancia();
  const center = posicaoAtual || destino;

  return (
    <div className="relative h-screen">
      <MapContainer
        center={center}
        zoom={16}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} />

        {posicaoAtual && <Marker position={posicaoAtual} />}

        <Marker position={destino} />

        {posicaoAtual && (
          <Polyline
            positions={[posicaoAtual, destino]}
            color="#0B4F3A"
            weight={3}
          />
        )}
      </MapContainer>

      <div className="absolute top-4 left-4 right-4 bg-white rounded-lg shadow-md p-4 z-[1000]">
        <p>
          <strong>Destino:</strong> Quadra {quadraNome} - Lote {loteNumero}
        </p>
        {distancia !== null && (
          <p className="text-sm text-gray-600 mt-1">
            Você está a aproximadamente {distancia}m do destino
          </p>
        )}
      </div>

      {loteRamal && (
        <button
          onClick={() => setRamalVisivel(!ramalVisivel)}
          className="fixed bottom-20 right-4 bg-[#0B4F3A] text-white p-4 rounded-full shadow-lg z-[1000] hover:bg-[#0a3f2f] transition-colors"
        >
          <Phone size={24} />
        </button>
      )}

      {ramalVisivel && loteRamal && (
        <div className="fixed bottom-36 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000] w-64">
          <p className="text-sm text-gray-600">Morador</p>
          <p className="font-medium mb-2">{loteMorador}</p>
          <p className="text-sm text-gray-600">Ramal</p>
          <p className="font-medium mb-3">{loteRamal}</p>
          <a
            href={`tel:${loteRamal}`}
            className="block text-center bg-[#0B4F3A] text-white px-4 py-2 rounded hover:bg-[#0a3f2f]"
          >
            Ligar
          </a>
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-md p-3 z-[1000]">
        <p className="text-sm text-gray-700">
          {distancia !== null && distancia < 50
            ? 'Você está próximo do destino!'
            : distancia !== null
            ? `Siga em frente por ${distancia}m`
            : 'Aguardando localização...'}
        </p>
      </div>

      {!posicaoAtual && (
        <div className="absolute inset-0 z-[2000] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <MapPin size={48} className="text-[#0B4F3A] animate-bounce mb-4" />
          <h2 className="text-xl font-medium text-gray-800 mb-2">Buscando sinal de GPS...</h2>
          <p className="text-gray-600 text-sm text-center px-6">
            Certifique-se de que a localização do seu dispositivo está ativada.
          </p>
        </div>
      )}
    </div>
  );
}
