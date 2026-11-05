import { describe, it, expect, vi } from 'vitest';
import { stampLines, drawOverlay } from '../../src/utils/drawOverlay';
import { defaultMetadata } from '../../src/utils/metadata';

const base = {
  ...defaultMetadata(undefined, new Date(2026, 10, 5, 14, 32, 8)),
  location: { lat: -8.432214, lng: 115.279041, source: 'map' as const }, placeName: 'Tegallalang, Gianyar, Bali',
};

describe('stampLines', () => {
  it('all lines', () => expect(stampLines(base)).toEqual(['2026-11-05 14:32:08', '-8.43221, 115.27904', 'Tegallalang, Gianyar, Bali']));
  it('coords off', () => expect(stampLines({ ...base, showCoords: false })).toEqual(['2026-11-05 14:32:08', 'Tegallalang, Gianyar, Bali']));
  it('place off', () => expect(stampLines({ ...base, showPlace: false })).toHaveLength(2));
  it('place pending', () => expect(stampLines({ ...base, placeName: null })).toHaveLength(2));
  it('no location', () => expect(stampLines({ ...base, location: null })).toEqual(['2026-11-05 14:32:08']));
});

describe('drawOverlay', () => {
  it('draws each line bottom-up for bottom positions, font is Geist Mono', () => {
    const ctx = { _f: '', fillText: vi.fn(), set font(v: string) { this._f = v; }, get font() { return this._f; } } as any;
    drawOverlay(ctx, 1000, 800, { ...base, fontSize: 40 });
    expect(ctx.font).toBe('40px "Geist Mono", ui-monospace, monospace');
    expect(ctx.fillText).toHaveBeenCalledTimes(3);
    const lastY = ctx.fillText.mock.calls[2][2];
    expect(lastY).toBeCloseTo(800 - 1000 * 0.02); // last baseline sits on the bottom padding
  });

  const mapCtx = () => ({ fillText: vi.fn(), drawImage: vi.fn() }) as any;
  const map = {} as CanvasImageSource;

  it('draws the map above the text for bottom positions, with OSM credit', () => {
    const ctx = mapCtx();
    drawOverlay(ctx, 1000, 800, { ...base, fontSize: 40, position: 'bottom-right' }, map);
    const [img, x, y, w, h] = ctx.drawImage.mock.calls[0];
    expect(img).toBe(map);
    expect(w).toBe(320); // 8 × font size, landscape 8:5
    expect(h).toBe(200); // 5 × font size
    expect(x).toBeCloseTo(1000 - 20 - 320); // right-aligned on the padding
    const firstTextTop = ctx.fillText.mock.calls[0][2] - 40;
    expect(y + h).toBeLessThan(firstTextTop);
    expect(ctx.fillText.mock.calls.some((c: any[]) => c[0] === '© OpenStreetMap')).toBe(true);
  });

  it('pushes the text below the map for top positions', () => {
    const ctx = mapCtx();
    drawOverlay(ctx, 1000, 800, { ...base, fontSize: 40, position: 'top-left' }, map);
    const [, x, y, , h] = ctx.drawImage.mock.calls[0];
    expect([x, y]).toEqual([20, 20]);
    expect(ctx.fillText.mock.calls[0][2] - 40).toBeGreaterThan(y + h);
  });

  it('skips the map when it is switched off or not loaded', () => {
    const ctx = mapCtx();
    drawOverlay(ctx, 1000, 800, { ...base, showMap: false }, map);
    drawOverlay(ctx, 1000, 800, base, null);
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });
});
