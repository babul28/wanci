import { FormEvent, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { AttributionControl, MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { Crosshair, Loader2, MapPin, Search, X } from 'lucide-react';
import { GeoPoint } from '../types';
import { PlaceResult, hasGeolocation, searchPlaces } from '../services/location';
import { useDeviceLocation } from '../hooks/useDeviceLocation';
import { usePlaceName } from '../hooks/usePlaceName';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { OSM_ATTRIBUTION, OSM_TILE_URL } from './LocationMap';

interface MapPickerModalProps {
  initial: GeoPoint | null;
  onCancel(): void;
  onConfirm(p: GeoPoint): void;
}

const PIN_ICON = L.divIcon({
  className: '',
  html: '<span style="display:block;width:20px;height:20px;border-radius:50%;background:#FF7A1A;border:3px solid #fff;box-shadow:0 0 0 6px rgba(255,122,26,.25)"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});
const INDONESIA = { lat: -2.5, lng: 118, zoom: 5 };

type SearchState = { kind: 'idle' } | { kind: 'loading' } | { kind: 'error' } | { kind: 'done'; results: PlaceResult[] };

const MapEvents = ({ onClick }: { onClick(lat: number, lng: number): void }) => {
  useMapEvents({
    click(e) {
      const ll = e.latlng.wrap(); // clicks on a repeated world copy give lng outside ±180
      onClick(ll.lat, ll.lng);
    },
  });
  return null;
};

const FlyTo = ({ target }: { target: { lat: number; lng: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16);
  }, [map, target]);
  return null;
};

export const MapPickerModal = ({ initial, onCancel, onConfirm }: MapPickerModalProps) => {
  const [pin, setPin] = useState<GeoPoint | null>(initial && { lat: initial.lat, lng: initial.lng, source: 'map' });
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<SearchState>({ kind: 'idle' });
  const [place, setPlace] = useState<string | null>(null);
  const placeStatus = usePlaceName(pin, setPlace);
  const isDesktop = useIsDesktop();
  const device = useDeviceLocation((p) => {
    setPin(p);
    setFlyTarget(p);
  });

  const cancel = useRef(onCancel);
  cancel.current = onCancel;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cancel.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const dropPin = (lat: number, lng: number) => setPin({ lat, lng, source: 'map' });

  // Nominatim policy: search on submit only, never as you type.
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || search.kind === 'loading') return;
    setSearch({ kind: 'loading' });
    try {
      setSearch({ kind: 'done', results: await searchPlaces(q) });
    } catch {
      setSearch({ kind: 'error' });
    }
  };

  const pick = (r: PlaceResult) => {
    dropPin(r.lat, r.lng);
    setFlyTarget({ lat: r.lat, lng: r.lng });
  };

  const start = initial ?? INDONESIA;
  const placeLine = place ?? (placeStatus === 'pending' ? 'Looking up place name…' : placeStatus === 'failed' ? 'Place name unavailable' : '');

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 lg:p-6" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div role="dialog" aria-modal="true" aria-label="Choose location" className="flex h-full w-full flex-col overflow-hidden bg-surface lg:h-[640px] lg:max-h-full lg:w-[880px] lg:rounded-[14px] lg:border lg:border-line">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <h2 className="text-[15px] font-semibold">Choose location</h2>
          <button type="button" aria-label="Close" onClick={onCancel} className="rounded-md p-1.5 text-ink-2 hover:bg-surface-2 hover:text-ink">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex max-h-[45%] shrink-0 flex-col gap-3 overflow-y-auto border-b border-line p-4 lg:max-h-none lg:w-[300px] lg:border-b-0 lg:border-r">
            <form role="search" onSubmit={submit} className="relative">
              <input
                type="search"
                aria-label="Search places"
                placeholder="Search a place"
                value={query}
                autoFocus={isDesktop}
                onChange={(e) => setQuery(e.target.value)}
                className="field pr-10 font-sans"
              />
              <button type="submit" aria-label="Search" className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-md text-ink-2 hover:text-ink">
                {search.kind === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
              </button>
            </form>

            {hasGeolocation() && (
              <div className="flex flex-col gap-1">
                <button type="button" onClick={device.locate} disabled={device.status.kind === 'locating'} className="flex items-center gap-2 text-left text-[13px] font-medium text-accent disabled:opacity-60">
                  {device.status.kind === 'locating' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Crosshair className="h-4 w-4" aria-hidden />}
                  Use my current location
                </button>
                <p className="pl-6 text-xs text-ink-3">
                  {device.status.kind === 'denied'
                    ? 'Location access is blocked. Allow it from the lock icon in the address bar.'
                    : device.status.kind === 'error'
                      ? device.status.message
                      : 'Browser asks for permission once'}
                </p>
              </div>
            )}

            {search.kind === 'error' && <p role="alert" className="text-xs text-danger">Search failed. Try again.</p>}
            {search.kind === 'done' && search.results.length === 0 && <p className="text-xs text-ink-3">No places found.</p>}
            {search.kind === 'done' && search.results.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-3">Results</p>
                <ul className="flex flex-col">
                  {search.results.map((r) => {
                    const [name, ...rest] = r.name.split(', ');
                    const active = pin?.lat === r.lat && pin?.lng === r.lng;
                    return (
                      <li key={`${r.lat},${r.lng}`}>
                        <button type="button" aria-label={r.name} onClick={() => pick(r)} className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-surface-2 ${active ? 'bg-surface-2' : ''}`}>
                          <MapPin className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-accent' : 'text-ink-3'}`} aria-hidden />
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] text-ink">{name}</span>
                            <span className="block truncate text-xs text-ink-3">{rest.join(', ')}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="relative min-h-[240px] flex-1">
            <MapContainer center={[start.lat, start.lng]} zoom={initial ? 16 : INDONESIA.zoom} zoomControl={false} attributionControl={false} className="h-full w-full">
              <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
              <AttributionControl position="bottomright" prefix={false} />
              <ZoomControl position="topright" />
              <MapEvents onClick={dropPin} />
              <FlyTo target={flyTarget} />
              {pin && (
                <Marker
                  position={[pin.lat, pin.lng]}
                  icon={PIN_ICON}
                  draggable
                  eventHandlers={{
                    dragend: (e) => {
                      const ll = (e.target as L.Marker).getLatLng().wrap();
                      dropPin(ll.lat, ll.lng);
                    },
                  }}
                />
              )}
            </MapContainer>
            <span className="pointer-events-none absolute left-1/2 top-3 z-[1000] -translate-x-1/2 whitespace-nowrap rounded-md bg-bg/85 px-2.5 py-1 text-xs text-ink-2">
              Drag the pin or tap the map to drop it
            </span>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center gap-3 border-t border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[13px] text-ink">{pin ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : 'No pin yet'}</p>
            <p className="truncate text-xs text-ink-2">{pin ? placeLine : 'Search, or tap the map to drop a pin.'}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
            <button type="button" className="btn-primary" disabled={!pin} onClick={() => pin && onConfirm(pin)}>
              Use this location
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
