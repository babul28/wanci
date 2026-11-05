import { describe, it, expect, vi, beforeEach } from 'vitest';
import exifr from 'exifr';
import { readExif } from '../../src/services/exif';

vi.mock('exifr', () => ({ default: { gps: vi.fn(), parse: vi.fn() } }));

const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });

beforeEach(() => {
  vi.mocked(exifr.parse).mockResolvedValue({ DateTimeOriginal: new Date(2026, 10, 4, 14, 32, 8) });
});

describe('readExif', () => {
  it('reads capture time as wall-clock and GPS', async () => { // Review Focus 3
    vi.mocked(exifr.gps).mockResolvedValue({ latitude: -8.43221, longitude: 115.27904 });
    expect(await readExif(file)).toEqual({ capturedAt: '2026-11-04T14:32:08', gps: { lat: -8.43221, lng: 115.27904 } });
  });

  it('treats GPS 0,0 as no GPS', async () => { // Review Focus 2
    vi.mocked(exifr.gps).mockResolvedValue({ latitude: 0, longitude: 0 });
    expect(await readExif(file)).not.toHaveProperty('gps');
  });

  it('returns {} when exifr rejects', async () => {
    vi.mocked(exifr.gps).mockRejectedValue(new Error('bad file'));
    expect(await readExif(file)).toEqual({});
  });

  it('ignores a missing or invalid capture date', async () => {
    vi.mocked(exifr.gps).mockResolvedValue(undefined as any);
    vi.mocked(exifr.parse).mockResolvedValue({ DateTimeOriginal: new Date('nope') });
    expect(await readExif(file)).toEqual({});
  });
});
