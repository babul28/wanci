import { describe, it, expect } from 'vitest';
import { toLocalInput, formatStampTime, defaultMetadata, carryOver, DEFAULT_STYLE } from '../../src/utils/metadata';

const now = new Date(2026, 10, 5, 9, 0, 0);
const exifFull = { capturedAt: '2026-11-04T14:32:08', gps: { lat: -8.43221, lng: 115.27904 } };

describe('metadata', () => {
  it('toLocalInput keeps wall-clock time', () => { // Review Focus 3
    expect(toLocalInput(new Date(2026, 10, 4, 14, 32, 8))).toBe('2026-11-04T14:32:08');
  });
  it('formatStampTime', () => expect(formatStampTime('2026-11-04T14:32:08')).toBe('2026-11-04 14:32:08'));
  it('defaults from full EXIF', () => {
    const m = defaultMetadata(exifFull, now);
    expect(m).toMatchObject({
      timestamp: '2026-11-04T14:32:08', timestampSource: 'capture',
      location: { lat: -8.43221, lng: 115.27904, source: 'exif' }, placeName: null,
      showCoords: true, showPlace: true, ...DEFAULT_STYLE,
    });
  });
  it('defaults without EXIF', () => {
    expect(defaultMetadata(undefined, now)).toMatchObject({ timestamp: '2026-11-05T09:00:00', timestampSource: 'now', location: null });
  });
  it('carryOver keeps everything when new photo has no EXIF', () => {
    const prev = {
      ...defaultMetadata(undefined, now), location: { lat: 1, lng: 2, source: 'map' as const },
      placeName: 'X', timestamp: '2026-01-01T08:00:00', timestampSource: 'custom' as const, color: '#FFFFFF', showCoords: false,
    };
    expect(carryOver(prev, undefined, now)).toEqual(prev);
  });
  it('carryOver refreshes a carried Now', () => {
    const prev = defaultMetadata(undefined, new Date(2026, 0, 1));
    expect(carryOver(prev, undefined, now).timestamp).toBe('2026-11-05T09:00:00');
  });
  it('carryOver: new EXIF wins', () => {
    const prev = { ...defaultMetadata(undefined, now), location: { lat: 1, lng: 2, source: 'map' as const }, placeName: 'X' };
    const m = carryOver(prev, exifFull, now);
    expect(m.location).toEqual({ lat: -8.43221, lng: 115.27904, source: 'exif' });
    expect(m.placeName).toBeNull();
    expect(m).toMatchObject({ timestampSource: 'capture', timestamp: '2026-11-04T14:32:08' });
  });
});
