import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  geoErrorToStatus, getDevicePosition, formatPlaceName, reverseGeocode, cachedPlaceName, searchPlaces,
  _resetLocationServiceForTests,
} from '../../src/services/location';

const FIX_MSG = "Couldn't get a fix. Try again or pick on map.";
const okJson = (body: unknown) => ({ ok: true, json: async () => body });
const place = okJson({ address: { village: 'Tegallalang', county: 'Gianyar', state: 'Bali' }, display_name: 'x' });

beforeEach(() => {
  _resetLocationServiceForTests();
  vi.stubGlobal('fetch', vi.fn(async () => place));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('geolocation', () => {
  it('maps error codes to statuses', () => {
    expect(geoErrorToStatus(1)).toEqual({ kind: 'denied' });
    expect(geoErrorToStatus(2)).toEqual({ kind: 'error', message: FIX_MSG });
    expect(geoErrorToStatus(3)).toEqual({ kind: 'error', message: FIX_MSG });
  });

  it('resolves a device fix with accuracy', async () => {
    const getCurrentPosition = vi.fn((ok: PositionCallback, _err?: unknown, _opts?: PositionOptions) =>
      ok({ coords: { latitude: -8.4, longitude: 115.2, accuracy: 12.4 } } as GeolocationPosition));
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
    await expect(getDevicePosition()).resolves.toEqual({ lat: -8.4, lng: 115.2, accuracy: 12.4, source: 'device' });
    expect(getCurrentPosition.mock.calls[0][2]).toEqual({ enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 });
  });

  it('rejects with the mapped status', async () => {
    const getCurrentPosition = vi.fn((_: PositionCallback, err: PositionErrorCallback) => err({ code: 1 } as GeolocationPositionError));
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
    await expect(getDevicePosition()).rejects.toEqual({ kind: 'denied' });
  });
});

describe('formatPlaceName', () => {
  it('builds village, county, state', () => {
    expect(formatPlaceName({ village: 'Tegallalang', county: 'Gianyar', state: 'Bali' }, 'x')).toBe('Tegallalang, Gianyar, Bali');
  });
  it('falls back to display_name', () => expect(formatPlaceName({}, 'Somewhere, ID')).toBe('Somewhere, ID'));
});

describe('reverseGeocode', () => {
  it('caches by 5-decimal key', async () => {
    expect(await reverseGeocode(-8.432211, 115.279041)).toBe('Tegallalang, Gianyar, Bali');
    expect(await reverseGeocode(-8.432212, 115.279042)).toBe('Tegallalang, Gianyar, Bali');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(cachedPlaceName(-8.432211, 115.279041)).toBe('Tegallalang, Gianyar, Bali');
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/reverse\?format=jsonv2&lat=-8\.432211&lon=115\.279041&zoom=16&accept-language=/);
  });

  it('starts requests at most once per second', async () => {
    vi.useFakeTimers();
    const a = reverseGeocode(1, 1);
    const b = reverseGeocode(2, 2);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(999);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    await Promise.all([a, b]);
  });

  it('returns null on network error or non-OK', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
    expect(await reverseGeocode(3, 3)).toBeNull();
    _resetLocationServiceForTests();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    expect(await reverseGeocode(4, 4)).toBeNull();
  });
});

describe('searchPlaces', () => {
  it('maps results and limits to 5', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okJson([{ display_name: 'Ubud, Bali', lat: '-8.5', lon: '115.26' }]) as Response);
    expect(await searchPlaces('ubud')).toEqual([{ name: 'Ubud, Bali', lat: -8.5, lng: 115.26 }]);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/search\?format=jsonv2&q=ubud&limit=5/);
  });
  it('throws on failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    await expect(searchPlaces('x')).rejects.toThrow();
  });
});
