import { GeoPoint } from '../types';

export type DeviceStatus =
  | { kind: 'idle' }
  | { kind: 'locating' }
  | { kind: 'denied' }
  | { kind: 'error'; message: string };

// ---- Device location (needs a secure context: HTTPS or localhost) ----

export const hasGeolocation = (): boolean => typeof navigator !== 'undefined' && !!navigator.geolocation;

export const geoErrorToStatus = (code: number): DeviceStatus =>
  code === 1 ? { kind: 'denied' } : { kind: 'error', message: "Couldn't get a fix. Try again or pick on map." };

/** Rejects with a `DeviceStatus`, not an Error. */
export const getDevicePosition = (): Promise<GeoPoint> =>
  new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, source: 'device' }),
      (e) => reject(geoErrorToStatus(e.code)),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    ),
  );

// ---- Nominatim: max 1 request/s, search on submit only, results cached ----

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const cache = new Map<string, string>();
const key = (lat: number, lng: number) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

let queue: Promise<void> = Promise.resolve();
let lastStart = -Infinity;

/** Every Nominatim request goes through here: each starts at least 1000 ms after the previous one started. */
const throttled = <T>(request: () => Promise<T>): Promise<T> => {
  const slot = queue.then(async () => {
    const wait = lastStart + 1000 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastStart = Date.now();
  });
  queue = slot;
  return slot.then(request);
};

export const formatPlaceName = (address: Record<string, string> | undefined, displayName: string): string => {
  const a = address ?? {};
  const parts = [a.village || a.suburb || a.town, a.county || a.city, a.state].filter(Boolean);
  return parts.length ? parts.join(', ') : displayName;
};

export const cachedPlaceName = (lat: number, lng: number): string | undefined => cache.get(key(lat, lng));

/** Place name for a point, or null when it can't be resolved. Never rejects. */
export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  const k = key(lat, lng);
  const hit = cache.get(k);
  if (hit) return hit;
  try {
    const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&accept-language=${encodeURIComponent(navigator.language)}`;
    const res = await throttled(() => fetch(url));
    if (!res.ok) return null;
    const data = await res.json();
    const name = formatPlaceName(data?.address, data?.display_name ?? '');
    if (!name) return null;
    cache.set(k, name);
    return name;
  } catch {
    return null;
  }
};

export type PlaceResult = { name: string; lat: number; lng: number };

/** Throws on network error or non-OK response. */
export const searchPlaces = async (q: string): Promise<PlaceResult[]> => {
  const res = await throttled(() => fetch(`${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5`));
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const rows: { display_name: string; lat: string; lon: string }[] = await res.json();
  return rows.map((r) => ({ name: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
};

export const _resetLocationServiceForTests = (): void => {
  cache.clear();
  queue = Promise.resolve();
  lastStart = -Infinity;
};
