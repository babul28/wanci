import { describe, it, expect, vi, afterEach } from 'vitest';
import { mapTiles, loadStaticMap, MAP_W, MAP_H, _resetStaticMapForTests } from '../../src/services/staticMap';

afterEach(() => {
  vi.unstubAllGlobals();
  _resetStaticMapForTests();
});

describe('mapTiles', () => {
  it('centres the point: at 0,0 the four zoom-17 tiles meet in the middle of the 512×320 map', () => {
    expect([MAP_W, MAP_H]).toEqual([512, 320]);
    expect(mapTiles(0, 0)).toEqual([
      { url: 'https://tile.openstreetmap.org/17/65535/65535.png', dx: 0, dy: -96 },
      { url: 'https://tile.openstreetmap.org/17/65536/65535.png', dx: 256, dy: -96 },
      { url: 'https://tile.openstreetmap.org/17/65535/65536.png', dx: 0, dy: 160 },
      { url: 'https://tile.openstreetmap.org/17/65536/65536.png', dx: 256, dy: 160 },
    ]);
  });

  it('covers the whole map for an off-grid point', () => {
    const tiles = mapTiles(-8.43221, 115.27904);
    expect(Math.min(...tiles.map((t) => t.dx))).toBeLessThanOrEqual(0);
    expect(Math.max(...tiles.map((t) => t.dx + 256))).toBeGreaterThanOrEqual(MAP_W);
    expect(Math.min(...tiles.map((t) => t.dy))).toBeLessThanOrEqual(0);
    expect(Math.max(...tiles.map((t) => t.dy + 256))).toBeGreaterThanOrEqual(MAP_H);
  });
});

describe('loadStaticMap', () => {
  it('resolves null when tiles cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(loadStaticMap(0, 0)).resolves.toBeNull();
  });
});
