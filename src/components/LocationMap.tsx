import { useEffect } from 'react';
import { AttributionControl, Circle, CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Maximize2 } from 'lucide-react';
import { GeoPoint } from '../types';
import { OSM_TILE_URL, PIN_STYLE, ZOOM } from '../services/staticMap';

export const OSM_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const Recenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [map, lat, lng]);
  return null;
};

interface LocationMapProps {
  point: GeoPoint;
  badge: string;
  dimmed?: boolean;
  onPick(): void;
}

/** Non-interactive preview of the chosen point. */
export const LocationMap = ({ point, badge, dimmed, onPick }: LocationMapProps) => (
  <div className={`relative h-[180px] overflow-hidden rounded-[10px] border border-line ${dimmed ? 'opacity-40' : ''}`}>
    <MapContainer
      center={[point.lat, point.lng]}
      zoom={ZOOM} // same view as the stamped map
      dragging={false}
      zoomControl={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      keyboard={false}
      boxZoom={false}
      attributionControl={false}
      className="h-full w-full"
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
      <AttributionControl position="bottomleft" prefix={false} />
      {point.source === 'device' && point.accuracy && (
        <Circle center={[point.lat, point.lng]} radius={point.accuracy} pathOptions={{ color: '#FF7A1A', weight: 1, fillOpacity: 0.15 }} />
      )}
      <CircleMarker center={[point.lat, point.lng]} radius={8} pathOptions={PIN_STYLE} />
      <Recenter lat={point.lat} lng={point.lng} />
    </MapContainer>
    <span className="absolute left-2 top-2 z-[1000] flex items-center gap-1.5 rounded-md bg-bg/85 px-2 py-1 font-mono text-[11px] text-ink">
      <span className={`h-1.5 w-1.5 rounded-full ${point.source === 'device' ? 'bg-ok' : 'bg-accent'}`} />
      {badge}
    </span>
    <button
      type="button"
      onClick={onPick}
      className="absolute bottom-2 right-2 z-[1000] flex items-center gap-1.5 rounded-md bg-bg/85 px-2 py-1 text-xs text-ink hover:bg-bg"
    >
      <Maximize2 className="h-3.5 w-3.5" aria-hidden />
      Pick on map
    </button>
  </div>
);
