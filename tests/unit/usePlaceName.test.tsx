import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlaceName } from '../../src/hooks/usePlaceName';
import { reverseGeocode, cachedPlaceName } from '../../src/services/location';
import { GeoPoint } from '../../src/types';

vi.mock('../../src/services/location', () => ({ reverseGeocode: vi.fn(), cachedPlaceName: vi.fn() }));

const A: GeoPoint = { lat: 1, lng: 1, source: 'map' };
const B: GeoPoint = { lat: 2, lng: 2, source: 'map' };

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(cachedPlaceName).mockReturnValue(undefined);
  vi.mocked(reverseGeocode).mockResolvedValue('Name A');
});
afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

const setup = (loc: GeoPoint | null, set = vi.fn()) => ({
  set,
  ...renderHook(({ l }) => usePlaceName(l, set), { initialProps: { l: loc } }),
});

describe('usePlaceName', () => {
  it('looks up after 800 ms of quiet', async () => {
    const { set, result } = setup(A);
    expect(result.current).toBe('pending');
    expect(set).toHaveBeenLastCalledWith(null);
    await act(() => vi.advanceTimersByTimeAsync(799));
    expect(reverseGeocode).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(reverseGeocode).toHaveBeenCalledTimes(1);
    expect(result.current).toBe('ok');
    expect(set).toHaveBeenLastCalledWith('Name A');
  });

  it('uses a cache hit immediately', () => {
    vi.mocked(cachedPlaceName).mockReturnValue('Cached');
    const { set, result } = setup(A);
    expect(set).toHaveBeenLastCalledWith('Cached');
    expect(result.current).toBe('ok');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores a stale result after the location changes', async () => { // Review Focus 4
    let resolveA!: (n: string | null) => void;
    vi.mocked(reverseGeocode).mockImplementationOnce(() => new Promise((r) => { resolveA = r; }));
    const { set, rerender } = setup(A);
    await act(() => vi.advanceTimersByTimeAsync(800));
    expect(reverseGeocode).toHaveBeenCalledWith(1, 1);
    vi.mocked(reverseGeocode).mockReturnValue(new Promise(() => {})); // B stays pending
    rerender({ l: B });
    await act(async () => resolveA('Name A'));
    expect(set).not.toHaveBeenCalledWith('Name A');
  });

  it('reports failed when no name comes back', async () => {
    vi.mocked(reverseGeocode).mockResolvedValue(null);
    const { result } = setup(A);
    await act(() => vi.advanceTimersByTimeAsync(800));
    expect(result.current).toBe('failed');
  });

  it('clears the name with no location', () => {
    const { set, result } = setup(null);
    expect(set).toHaveBeenCalledWith(null);
    expect(result.current).toBe('idle');
  });
});
