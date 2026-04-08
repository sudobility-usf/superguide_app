import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  useTransitRoute,
  formatDuration,
  formatDistance,
  geocode,
} from '@sudobility/superguide_lib';

interface TransitMapProps {
  fromName: string;
  toName: string;
  accentColor: string;
  nameColor: string;
}

export default function TransitMap({ fromName, toName, accentColor, nameColor }: TransitMapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const { routeInfo, loading, error } = useTransitRoute(fromName, toName);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    if (!routeInfo || !mapDivRef.current) return;

    let cancelled = false;

    async function renderMap() {
      const [fromCoords, toCoords] = await Promise.all([geocode(fromName), geocode(toName)]);
      if (cancelled || !fromCoords || !toCoords || !mapDivRef.current) return;

      const L = (await import('leaflet')).default;
      if (cancelled || !mapDivRef.current) return;

      const map = L.map(mapDivRef.current, { zoomControl: false, scrollWheelZoom: false });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CartoDB',
        maxZoom: 19,
      }).addTo(map);

      const polyline = L.polyline(routeInfo.coords, { color: accentColor, weight: 4, opacity: 0.85 }).addTo(map);

      const dotIcon = (color: string) =>
        L.divIcon({
          html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25);"></div>`,
          className: '',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

      L.marker([fromCoords.lat, fromCoords.lng], { icon: dotIcon('#A89070') }).addTo(map);
      L.marker([toCoords.lat, toCoords.lng], { icon: dotIcon(accentColor) }).addTo(map);
      map.fitBounds(polyline.getBounds(), { padding: [28, 28] });
    }

    renderMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [routeInfo, fromName, toName, accentColor]);

  return (
    <div>
      <div
        ref={mapDivRef}
        style={{ height: 210, borderRadius: 14, overflow: 'hidden', background: '#EDE8DF', position: 'relative' }}
      >
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 10, background: '#EDE8DF',
          }}>
            <div className="animate-spin rounded-full border-b-2"
              style={{ width: 24, height: 24, borderColor: accentColor }} />
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-xs" style={{ color: '#B05050' }}>Could not load route.</p>}

      {routeInfo && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xl">{routeInfo.mode === 'walking' ? '🚶' : '🚗'}</span>
          <div>
            <span className="text-sm font-bold" style={{ color: nameColor }}>
              {routeInfo.mode === 'walking' ? 'Walk' : 'Drive'}
            </span>
            <span className="text-sm" style={{ color: accentColor }}>
              {'  ·  '}{formatDuration(routeInfo.duration)}{'  ·  '}{formatDistance(routeInfo.distance)}
            </span>
          </div>
        </div>
      )}

      {routeInfo && (
        <div className="mt-2 flex items-center gap-2 flex-wrap text-xs" style={{ color: accentColor, opacity: 0.75 }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#A89070' }} />
          <span>{fromName}</span>
          <span>→</span>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: accentColor }} />
          <span>{toName}</span>
        </div>
      )}
    </div>
  );
}
