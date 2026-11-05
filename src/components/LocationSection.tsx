import { useEffect, useState } from 'react';
import { Crosshair, Loader2, MapPin, ShieldAlert } from 'lucide-react';
import { GeoPoint, OverlayMetadata, Patch } from '../types';
import { parseCoordinate } from '../utils/validation';
import { hasGeolocation } from '../services/location';
import { useDeviceLocation } from '../hooks/useDeviceLocation';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { PlaceStatus } from '../hooks/usePlaceName';
import { LocationMap } from './LocationMap';
import { Switch } from './ui/Switch';

interface LocationSectionProps {
  metadata: OverlayMetadata;
  onChange(patch: Patch): void;
  placeStatus: PlaceStatus;
  onOpenPicker(): void;
}

const show = (n: number | undefined) => (n === undefined ? '' : String(+n.toFixed(5)));

const badgeFor = (p: GeoPoint) =>
  p.source === 'exif' ? 'FROM PHOTO'
  : p.source === 'device' ? (p.accuracy !== undefined ? `GPS ±${Math.round(p.accuracy)} m` : 'GPS')
  : p.source === 'map' ? 'FROM MAP'
  : 'MANUAL';

export const LocationSection = ({ metadata, onChange, placeStatus, onOpenPicker }: LocationSectionProps) => {
  const loc = metadata.location;
  const isDesktop = useIsDesktop();
  const canLocate = hasGeolocation();
  const device = useDeviceLocation((p) => onChange({ location: p, placeName: null }));
  const [lat, setLat] = useState(show(loc?.lat));
  const [lng, setLng] = useState(show(loc?.lng));
  const [error, setError] = useState<string | null>(null);

  // Any other source (EXIF, picker, device, Reset) replaces what was typed, and ends a pending device request.
  const { cancel } = device;
  useEffect(() => {
    setLat(show(loc?.lat));
    setLng(show(loc?.lng));
    setError(null);
    cancel();
  }, [loc, cancel]);

  const commit = () => {
    const a = parseCoordinate(lat, 'lat');
    const b = parseCoordinate(lng, 'lng');
    if (!lat.trim() && !lng.trim()) {
      setError(null);
      if (loc) onChange({ location: null, placeName: null });
    } else if (a !== null && b !== null) {
      setError(null);
      // Compare with what is shown (5 dp): a bare blur must not relabel a precise EXIF/device point as manual.
      if (lat.trim() !== show(loc?.lat) || lng.trim() !== show(loc?.lng)) onChange({ location: { lat: a, lng: b, source: 'manual' }, placeName: null });
    } else if ((lat.trim() && a === null) || (lng.trim() && b === null)) {
      setError('Latitude must be between -90 and 90, longitude between -180 and 180.');
    }
  };

  const field = (label: string, aria: string, value: string, set: (v: string) => void) => (
    <label className="relative flex-1">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-ink-3">{label}</span>
      <input
        aria-label={aria}
        inputMode="decimal"
        placeholder={label === 'LAT' ? '-8.43221' : '115.27904'}
        value={value}
        onChange={(e) => set(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="field pl-11 placeholder:text-ink-3/60"
      />
    </label>
  );

  const pickBtn = (primary: boolean) => (
    <button type="button" className={primary ? 'btn-primary' : 'btn-ghost'} onClick={onOpenPicker}>
      Pick on map
    </button>
  );
  const locateBtn = (primary: boolean, label = 'Use my location') =>
    canLocate && (
      <button type="button" className={primary ? 'btn-primary' : 'btn-ghost'} onClick={device.locate}>
        <Crosshair className="h-4 w-4" aria-hidden />
        {label}
      </button>
    );

  const status = device.status;
  let body;
  if (status.kind === 'locating') {
    body = (
      <div className="flex flex-col gap-3">
        <div className="relative">
          {loc ? <LocationMap point={loc} badge={badgeFor(loc)} dimmed onPick={onOpenPicker} /> : <div className="h-[180px] rounded-[10px] border border-line bg-surface-2 opacity-60" />}
          <div className="absolute inset-0 z-[1001] flex items-center justify-center gap-2 text-xs text-ink">
            <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden />
            Finding your location…
          </div>
        </div>
        <p className="text-xs text-ink-3">If your browser asks, choose Allow. This usually takes a few seconds.</p>
        <div>
          <button type="button" className="btn-ghost" onClick={device.cancel}>Cancel</button>
        </div>
      </div>
    );
  } else if (status.kind === 'denied') {
    body = (
      <div className="flex flex-col gap-3 rounded-[10px] border border-danger/40 bg-danger/10 p-3">
        <p className="flex items-start gap-2 text-[13px] text-ink">
          <ShieldAlert className="mt-px h-4 w-4 shrink-0 text-danger" aria-hidden />
          Location access is blocked. Click the lock icon in the address bar to allow it, then try again.
        </p>
        <div className="flex flex-wrap gap-2">
          {pickBtn(true)}
          {locateBtn(false, 'Try again')}
        </div>
      </div>
    );
  } else if (!loc) {
    body = (
      <div className="flex flex-col gap-3">
        {status.kind === 'error' ? (
          <div className="flex flex-col gap-3">
            <p role="alert" className="text-[13px] text-danger">{status.message}</p>
            <div className="flex flex-wrap gap-2">
              {locateBtn(true, 'Try again')}
              {pickBtn(!canLocate)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-line px-4 py-5 text-center">
            <MapPin className="h-5 w-5 text-ink-3" aria-hidden />
            <div>
              <p className="text-[13px] text-ink">This photo has no GPS data.</p>
              <p className="text-xs text-ink-3">Add a location to stamp it on the photo.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {isDesktop || !canLocate ? <>{pickBtn(true)}{locateBtn(false)}</> : <>{locateBtn(true)}{pickBtn(false)}</>}
            </div>
          </div>
        )}
        <p className="text-xs text-ink-3">Or type coordinates below.</p>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-2">
        {status.kind === 'error' && <p role="alert" className="text-xs text-danger">{status.message}</p>}
        <LocationMap point={loc} badge={badgeFor(loc)} onPick={onOpenPicker} />
        {loc.source === 'exif' && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-2">Location read from the photo.</p>
            <button type="button" className="btn-ghost lg:w-full" onClick={device.locate}>
              <Crosshair className="h-4 w-4" aria-hidden />
              Use my location instead
            </button>
          </div>
        )}
        {loc.source === 'device' && isDesktop && (
          <p className="text-xs text-ink-2">This is where you are now, not necessarily where the photo was taken.</p>
        )}
      </div>
    );
  }

  const showHeaderLocate = loc && loc.source !== 'exif' && status.kind === 'idle';
  const place = metadata.placeName ?? (placeStatus === 'pending' ? 'Looking up place name…' : placeStatus === 'failed' ? 'Place name unavailable' : null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex min-h-8 items-center justify-between">
          <h2 className="section-title">Location</h2>
          {showHeaderLocate && canLocate && (
            <button type="button" onClick={device.locate} className="btn h-8 bg-accent-soft px-2.5 text-[13px] text-accent">
              <Crosshair className="h-3.5 w-3.5" aria-hidden />
              Use my location
            </button>
          )}
        </div>
        <p className="text-[11px] text-ink-3">Place names by OpenStreetMap</p>
      </div>
      {body}
      <div className="flex gap-2">
        {field('LAT', 'Latitude', lat, setLat)}
        {field('LNG', 'Longitude', lng, setLng)}
      </div>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      {loc && place && (
        <p className={`flex items-start gap-2 text-sm ${metadata.placeName ? 'text-ink' : 'text-ink-3'}`}>
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
          {place}
        </p>
      )}
      <div className="flex flex-col gap-1">
        <Switch label="Show coordinates on photo" checked={metadata.showCoords} onChange={(v) => onChange({ showCoords: v })} />
        <Switch label="Show place name on photo" checked={metadata.showPlace} onChange={(v) => onChange({ showPlace: v })} />
      </div>
    </div>
  );
};
