import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Quadra, Lote } from '../../../shared/types';

const PALETTE = ['#0B4F3A', '#2563eb', '#d97706', '#9333ea', '#dc2626', '#0891b2'];

interface Props {
  quadras: Quadra[];
  lotesPorQuadra: Record<number, Lote[]>;
}

function BoundsFitter({ positions }: { positions: L.LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;
    map.fitBounds(L.latLngBounds(positions), { padding: [60, 60], maxZoom: 18 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions.length]);

  return null;
}

export default function MapaCondominio({ quadras, lotesPorQuadra }: Props) {
  const [ativas, setAtivas] = useState<Set<number>>(() => new Set(quadras.map((q) => q.id)));

  const colorMap = useMemo(() => {
    const m: Record<number, string> = {};
    quadras.forEach((q, i) => { m[q.id] = PALETTE[i % PALETTE.length]; });
    return m;
  }, [quadras]);

  const visiblePositions = useMemo<L.LatLngTuple[]>(() => {
    const positions: L.LatLngTuple[] = [];
    quadras.forEach((q) => {
      if (!ativas.has(q.id)) return;
      (lotesPorQuadra[q.id] || []).forEach((l) => {
        if (l.latitude && l.longitude) positions.push([l.latitude, l.longitude]);
      });
    });
    return positions;
  }, [quadras, lotesPorQuadra, ativas]);

  const toggleQuadra = (id: number) => {
    setAtivas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allLotes = useMemo(() => Object.values(lotesPorQuadra).flat(), [lotesPorQuadra]);
  const totalOcupados = allLotes.filter((l) => l.nome_morador).length;

  const defaultCenter: L.LatLngTuple = useMemo(() => {
    const first = allLotes.find((l) => l.latitude && l.longitude);
    return first ? [first.latitude!, first.longitude!] : [-15.7801, -47.9292];
  }, [allLotes]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
      {/* Stats bar — top center */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
        <div className="flex items-center gap-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-md border border-gray-100 dark:border-gray-800 text-xs whitespace-nowrap">
          <span className="text-gray-500 dark:text-gray-400">
            <span className="font-bold text-gray-800 dark:text-white">{allLotes.length}</span> lotes
          </span>
          <span className="w-px h-3.5 bg-gray-200 dark:bg-gray-700" />
          <span className="text-[#0B4F3A] dark:text-[#28b88d]">
            <span className="font-bold">{totalOcupados}</span> ocupados
          </span>
          <span className="w-px h-3.5 bg-gray-200 dark:bg-gray-700" />
          <span className="text-gray-400 dark:text-gray-500">
            <span className="font-bold text-gray-600 dark:text-gray-300">{allLotes.length - totalOcupados}</span> vagos
          </span>
        </div>
      </div>

      {/* Legend + filter — bottom left */}
      <div className="absolute bottom-3 left-3 z-[1000]">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-md border border-gray-100 dark:border-gray-800">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-1">
            Quadras
          </p>
          <div className="flex flex-col gap-0.5 min-w-[130px]">
            {quadras.map((q) => {
              const color = colorMap[q.id];
              const ativa = ativas.has(q.id);
              const count = (lotesPorQuadra[q.id] || []).length;
              return (
                <button
                  key={q.id}
                  onClick={() => toggleQuadra(q.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    ativa ? 'opacity-100' : 'opacity-35'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-150"
                    style={{ backgroundColor: color, transform: ativa ? 'scale(1)' : 'scale(0.7)' }}
                  />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-1 text-left">
                    Quadra {q.nome}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-gray-300 bg-white dark:bg-gray-800" />
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Vago</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500" />
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Ocupado</span>
            </div>
          </div>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={16}
        className="h-[520px] w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <BoundsFitter positions={visiblePositions} />

        {quadras.map((q) => {
          if (!ativas.has(q.id)) return null;
          const color = colorMap[q.id];

          return (lotesPorQuadra[q.id] || [])
            .filter((l) => l.latitude && l.longitude)
            .map((lote) => {
              const ocupado = !!lote.nome_morador;
              return (
                <CircleMarker
                  key={lote.id}
                  center={[lote.latitude!, lote.longitude!]}
                  radius={ocupado ? 10 : 7}
                  pathOptions={{
                    fillColor: color,
                    color: 'white',
                    weight: 2,
                    fillOpacity: ocupado ? 0.9 : 0.25,
                    opacity: 1,
                  }}
                  eventHandlers={{
                    mouseover: (e) => { e.target.setStyle({ fillOpacity: 1, weight: 3 }); },
                    mouseout: (e) => { e.target.setStyle({ fillOpacity: ocupado ? 0.9 : 0.25, weight: 2 }); },
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 160, fontFamily: 'inherit' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <span
                          style={{
                            width: 8, height: 8, borderRadius: '50%',
                            backgroundColor: color, flexShrink: 0,
                          }}
                        />
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>
                          Quadra {q.nome} — Lote {lote.numero}
                        </span>
                      </div>

                      {ocupado ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                            <span style={{ flexShrink: 0, opacity: 0.6 }}>👤</span>
                            <span>{lote.nome_morador}</span>
                          </div>
                          {lote.ramal && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
                              <span style={{ flexShrink: 0, opacity: 0.6 }}>📞</span>
                              <span>Ramal {lote.ramal}</span>
                            </div>
                          )}
                          <div
                            style={{
                              marginTop: 4, padding: '2px 8px', borderRadius: 20,
                              backgroundColor: '#f0fdf4', color: '#15803d',
                              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                              letterSpacing: '0.05em', display: 'inline-block',
                            }}
                          >
                            Ocupado
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '2px 8px', borderRadius: 20,
                            backgroundColor: '#f3f4f6', color: '#9ca3af',
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.05em', display: 'inline-block',
                          }}
                        >
                          Lote vago
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            });
        })}
      </MapContainer>
    </div>
  );
}
