import { useEffect, useState } from 'react';
import { OverlayMetadata, Patch } from '../types';
import { parseCoordinate } from '../utils/validation';
import { Switch } from './ui/Switch';

interface LocationSectionProps {
  metadata: OverlayMetadata;
  onChange(patch: Patch): void;
}

const show = (n: number | undefined) => (n === undefined ? '' : String(+n.toFixed(5)));

export const LocationSection = ({ metadata, onChange }: LocationSectionProps) => {
  const loc = metadata.location;
  const [lat, setLat] = useState(show(loc?.lat));
  const [lng, setLng] = useState(show(loc?.lng));
  const [error, setError] = useState<string | null>(null);

  // Any other source (EXIF, picker, Reset) replaces what was typed.
  useEffect(() => {
    setLat(show(loc?.lat));
    setLng(show(loc?.lng));
    setError(null);
  }, [loc]);

  const commit = () => {
    const a = parseCoordinate(lat, 'lat');
    const b = parseCoordinate(lng, 'lng');
    if (!lat.trim() && !lng.trim()) {
      setError(null);
      if (loc) onChange({ location: null, placeName: null });
    } else if (a !== null && b !== null) {
      setError(null);
      if (a !== loc?.lat || b !== loc?.lng) onChange({ location: { lat: a, lng: b, source: 'manual' }, placeName: null });
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

  return (
    <div className="flex flex-col gap-3">
      <h2 className="section-title">Location</h2>
      <div className="flex gap-2">
        {field('LAT', 'Latitude', lat, setLat)}
        {field('LNG', 'Longitude', lng, setLng)}
      </div>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      <div className="flex flex-col gap-1">
        <Switch label="Show coordinates on photo" checked={metadata.showCoords} onChange={(v) => onChange({ showCoords: v })} />
        <Switch label="Show place name on photo" checked={metadata.showPlace} onChange={(v) => onChange({ showPlace: v })} />
      </div>
    </div>
  );
};
