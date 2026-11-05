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
});
