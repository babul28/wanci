import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeviceLocation } from '../../src/hooks/useDeviceLocation';
import { getDevicePosition } from '../../src/services/location';
import { GeoPoint } from '../../src/types';

vi.mock('../../src/services/location', async (orig) => ({
  ...(await orig<typeof import('../../src/services/location')>()),
  getDevicePosition: vi.fn(),
}));

const FIX: GeoPoint = { lat: 1, lng: 2, accuracy: 12, source: 'device' };
let settle: { resolve(p: GeoPoint): void; reject(s: unknown): void };

beforeEach(() => {
  vi.mocked(getDevicePosition).mockImplementation(() => new Promise((resolve, reject) => { settle = { resolve, reject }; }));
});

describe('useDeviceLocation', () => {
  it('locating, then the fix calls onFix', async () => {
    const onFix = vi.fn();
    const { result } = renderHook(() => useDeviceLocation(onFix));
    act(() => result.current.locate());
    expect(result.current.status).toEqual({ kind: 'locating' });
    await act(async () => settle.resolve(FIX));
    expect(onFix).toHaveBeenCalledWith(FIX);
    expect(result.current.status).toEqual({ kind: 'idle' });
  });

  it('permission denied', async () => {
    const { result } = renderHook(() => useDeviceLocation(vi.fn()));
    act(() => result.current.locate());
    await act(async () => settle.reject({ kind: 'denied' }));
    expect(result.current.status).toEqual({ kind: 'denied' });
  });

  it('cancel discards a late fix', async () => {
    const onFix = vi.fn();
    const { result } = renderHook(() => useDeviceLocation(onFix));
    act(() => result.current.locate());
    act(() => result.current.cancel());
    await act(async () => settle.resolve(FIX));
    expect(onFix).not.toHaveBeenCalled();
    expect(result.current.status).toEqual({ kind: 'idle' });
  });

  it('an unexpected failure becomes the generic error', async () => {
    const { result } = renderHook(() => useDeviceLocation(vi.fn()));
    act(() => result.current.locate());
    await act(async () => settle.reject(new TypeError('no geolocation')));
    expect(result.current.status).toEqual({ kind: 'error', message: "Couldn't get a fix. Try again or pick on map." });
  });
});
