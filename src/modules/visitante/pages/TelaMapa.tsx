import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router';
import { Phone, MapPin, Navigation2, X, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import L from 'leaflet';
import { useVisitanteStore } from '../../../shared/store/visitanteStore';
import { motion, AnimatePresence } from 'motion/react';

type GpsState =
  | { kind: 'searching' }
  | { kind: 'ok' }
  | { kind: 'denied' }
  | { kind: 'unavailable' }
  | { kind: 'timeout' }
  | { kind: 'insecure' }
  | { kind: 'unsupported' }
  | { kind: 'skipped' };

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 16); }, [center, map]);
  return null;
}

function calcularDistanciaM(a: [number, number], b: [number, number]): number {
  const R = 6371e3;
  const φ1 = (a[0] * Math.PI) / 180;
  const φ2 = (b[0] * Math.PI) / 180;
  const Δφ = ((b[0] - a[0]) * Math.PI) / 180;
  const Δλ = ((b[1] - a[1]) * Math.PI) / 180;
  const x =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

export default function TelaMapa() {
  const navigate = useNavigate();
  const [posicaoAtual, setPosicaoAtual] = useState<[number, number] | null>(null);
  const [gps, setGps] = useState<GpsState>({ kind: 'searching' });
  const [ramalAberto, setRamalAberto] = useState(false);
  const { loteLat, loteLon, loteMorador, loteRamal, quadraNome, loteNumero } = useVisitanteStore();

  const destino: [number, number] = [loteLat || -15.7801, loteLon || -47.9292];
  const center = posicaoAtual || destino;
  const distancia = posicaoAtual ? calcularDistanciaM(posicaoAtual, destino) : null;
  const chegou = distancia !== null && distancia < 30;
  const overlayBloqueante = gps.kind === 'searching';

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGps({ kind: 'unsupported' });
      return;
    }

    // Browsers só permitem geolocation em contextos seguros (HTTPS ou localhost).
    // Detecta esse caso pra mostrar mensagem útil em vez de ficar preso.
    const isSecureContext =
      typeof window !== 'undefined' &&
      (window.isSecureContext ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1');

    if (!isSecureContext) {
      setGps({ kind: 'insecure' });
      return;
    }

    let watchId: number | null = null;
    const timeoutId = window.setTimeout(() => {
      setGps((prev) => (prev.kind === 'searching' ? { kind: 'timeout' } : prev));
    }, 12000);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosicaoAtual([pos.coords.latitude, pos.coords.longitude]);
        setGps({ kind: 'ok' });
        window.clearTimeout(timeoutId);
      },
      (err) => {
        window.clearTimeout(timeoutId);
        if (err.code === err.PERMISSION_DENIED) setGps({ kind: 'denied' });
        else if (err.code === err.POSITION_UNAVAILABLE) setGps({ kind: 'unavailable' });
        else if (err.code === err.TIMEOUT) setGps({ kind: 'timeout' });
        else setGps({ kind: 'unavailable' });
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Map */}
      <MapContainer center={center} zoom={16} className="h-full w-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} />
        {posicaoAtual && <Marker position={posicaoAtual} />}
        <Marker position={destino} />
        {posicaoAtual && (
          <Polyline positions={[posicaoAtual, destino]} color="#0B4F3A" weight={4} opacity={0.8} />
        )}
      </MapContainer>

      {/* Top info card */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-3.5"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B4F3A]/10 dark:bg-[#28b88d]/10 flex items-center justify-center shrink-0">
              <MapPin size={16} className="text-[#0B4F3A] dark:text-[#28b88d]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Destino
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                Quadra {quadraNome} · Lote {loteNumero}
              </p>
            </div>
            {distancia !== null && (
              <div className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                chegou
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-[#0B4F3A]/8 dark:bg-[#28b88d]/10 text-[#0B4F3A] dark:text-[#28b88d]'
              }`}>
                {chegou ? 'Chegou!' : `~${distancia}m`}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-3.5 flex items-center gap-3"
        >
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            chegou
              ? 'bg-green-500'
              : posicaoAtual
              ? 'bg-[#28b88d] animate-pulse'
              : gps.kind === 'searching'
              ? 'bg-amber-400 animate-pulse'
              : 'bg-gray-400'
          }`} />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
            {chegou
              ? 'Você está próximo do destino!'
              : posicaoAtual
              ? `Siga em direção ao destino — ~${distancia}m`
              : gps.kind === 'searching'
              ? 'Aguardando GPS...'
              : 'Use o mapa para se orientar até o destino'}
          </p>
          <Navigation2 size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
        </motion.div>

        {/* Botão de confirmar chegada — sempre disponível, não depende de GPS */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => navigate('/visitante/chegada')}
          className={`w-full rounded-2xl p-4 flex items-center justify-center gap-2.5 font-bold text-sm shadow-lg active:scale-[0.98] transition-transform ${
            chegou
              ? 'bg-[#0B4F3A] text-white'
              : 'bg-white dark:bg-gray-900 text-[#0B4F3A] dark:text-[#28b88d] border border-[#0B4F3A]/25 dark:border-[#28b88d]/25'
          }`}
        >
          <CheckCircle2 size={18} />
          {chegou ? 'Confirmar chegada' : 'Cheguei ao destino'}
        </motion.button>
      </div>

      {/* Phone FAB */}
      {loteRamal && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => setRamalAberto(!ramalAberto)}
          className="fixed bottom-[120px] right-4 w-13 h-13 bg-[#0B4F3A] text-white p-3.5 rounded-full shadow-xl z-[1000] hover:bg-[#0a3f2f] active:scale-95 transition-all"
        >
          <Phone size={22} />
        </motion.button>
      )}

      {/* Phone popup */}
      <AnimatePresence>
        {ramalAberto && loteRamal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed bottom-[180px] right-4 z-[1001] w-60 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contato do morador</p>
              <button onClick={() => setRamalAberto(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Morador</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{loteMorador || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Ramal</p>
                <p className="text-sm font-bold text-[#0B4F3A] dark:text-[#28b88d] font-mono mt-0.5">{loteRamal}</p>
              </div>
              <a
                href={`tel:${loteRamal}`}
                className="flex items-center justify-center gap-2 w-full bg-[#0B4F3A] text-white rounded-xl py-2.5 text-sm font-bold hover:bg-[#0a3f2f] transition-colors active:scale-[0.98]"
              >
                <Phone size={14} />
                Ligar
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPS overlay — bloqueante apenas durante a busca inicial */}
      <AnimatePresence>
        {overlayBloqueante && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[2000] bg-white/85 dark:bg-gray-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4 px-8 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-16 h-16 rounded-full bg-[#0B4F3A]/10 dark:bg-[#28b88d]/10 flex items-center justify-center"
            >
              <MapPin size={32} className="text-[#0B4F3A] dark:text-[#28b88d]" />
            </motion.div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-base">Buscando sinal GPS...</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Certifique-se de que a localização está ativada.
              </p>
            </div>
            <button
              onClick={() => setGps({ kind: 'skipped' })}
              className="mt-2 text-[12px] font-semibold text-gray-500 dark:text-gray-400 underline"
            >
              Continuar sem GPS
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner de aviso quando o GPS não está disponível */}
      <AnimatePresence>
        {!overlayBloqueante && gps.kind !== 'ok' && gps.kind !== 'skipped' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-[88px] left-4 right-4 z-[1000]"
          >
            <div className="bg-amber-50/95 dark:bg-amber-900/30 backdrop-blur-sm border border-amber-200 dark:border-amber-700/40 rounded-2xl shadow-lg p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                {gps.kind === 'insecure' ? (
                  <Lock size={14} className="text-amber-700 dark:text-amber-400" />
                ) : (
                  <AlertTriangle size={14} className="text-amber-700 dark:text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-amber-900 dark:text-amber-200">
                  {gps.kind === 'insecure' && 'GPS bloqueado — conexão não segura'}
                  {gps.kind === 'denied' && 'Permissão de localização negada'}
                  {gps.kind === 'unavailable' && 'GPS indisponível'}
                  {gps.kind === 'timeout' && 'Sem sinal de GPS'}
                  {gps.kind === 'unsupported' && 'GPS não suportado'}
                </p>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-snug">
                  {gps.kind === 'insecure' && 'O navegador exige HTTPS para acessar a localização. Mostrando o destino sem rastreio em tempo real.'}
                  {gps.kind === 'denied' && 'Habilite a localização nas configurações do site para ver sua posição.'}
                  {gps.kind === 'unavailable' && 'Não foi possível obter sua localização. Use o mapa para se orientar.'}
                  {gps.kind === 'timeout' && 'A localização está demorando. Você pode usar o mapa mesmo assim.'}
                  {gps.kind === 'unsupported' && 'Seu navegador não suporta geolocalização.'}
                </p>
              </div>
              <button
                onClick={() => setGps({ kind: 'skipped' })}
                className="shrink-0 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
