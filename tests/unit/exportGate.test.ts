import { describe, it, expect } from 'vitest';
import { exportBlocker, BLOCK_REASON } from '../../src/utils/exportGate';
import { defaultMetadata } from '../../src/utils/metadata';

const ok = { ...defaultMetadata(undefined, new Date()), location: { lat: 1, lng: 2, source: 'manual' as const } };

describe('exportBlocker', () => {
  it('is open when time and a location line will print', () => expect(exportBlocker(ok)).toBeNull());
  it('blocks without a location', () => expect(exportBlocker({ ...ok, location: null })).toBe('location'));
  it('blocks without a time', () => expect(exportBlocker({ ...ok, timestamp: '' })).toBe('time'));
  it('blocks when no location line prints', () => {
    expect(exportBlocker({ ...ok, showCoords: false, placeName: null })).toBe('lines');
    expect(exportBlocker({ ...ok, showCoords: false, showPlace: false, placeName: 'Bali' })).toBe('lines');
  });
  it('is open with only a resolved place name', () => {
    expect(exportBlocker({ ...ok, showCoords: false, showPlace: true, placeName: 'Bali' })).toBeNull();
  });
  it('reason copy', () => {
    expect(BLOCK_REASON).toEqual({ location: 'Add a location to export', time: 'Add a time to export', lines: 'Turn on coordinates or place name' });
  });
});
