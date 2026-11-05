// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest';
import exifr from 'exifr';
import piexif from 'piexifjs';
import { writeExif } from '../../src/services/exif';
import { defaultMetadata } from '../../src/utils/metadata';
import { OverlayMetadata } from '../../src/types';

// Smallest valid baseline JPEG (1×1 grey), standing in for the canvas output.
const PLAIN_JPEG = atob(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
);
const bytes = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0));
const jpeg = (s: string) => new Blob([bytes(s)], { type: 'image/jpeg' });

const camera = piexif.insert(
  piexif.dump({
    '0th': { [piexif.ImageIFD.Make]: 'Pixel', [piexif.ImageIFD.Orientation]: 6 },
    Exif: {
      [piexif.ExifIFD.DateTimeOriginal]: '2020:01:01 00:00:00',
      36881: '+08:00', // OffsetTimeOriginal
      [piexif.ExifIFD.SubSecTimeOriginal]: '123',
    },
    GPS: {
      [piexif.GPSIFD.GPSLatitudeRef]: 'N',
      [piexif.GPSIFD.GPSLatitude]: piexif.GPSHelper.degToDmsRational(1),
      [piexif.GPSIFD.GPSLongitudeRef]: 'E',
      [piexif.GPSIFD.GPSLongitude]: piexif.GPSHelper.degToDmsRational(2),
      [piexif.GPSIFD.GPSAltitude]: [120, 1],
      [piexif.GPSIFD.GPSDateStamp]: '2019:12:31',
    },
  }),
  PLAIN_JPEG,
);
const original = new File([bytes(camera)], 'cam.jpg', { type: 'image/jpeg' });

const meta = (patch: Partial<OverlayMetadata>): OverlayMetadata => ({
  ...defaultMetadata(undefined, new Date(2026, 10, 4)),
  timestamp: '2026-11-04T14:32:08',
  location: { lat: -8.43221, lng: 115.27904, source: 'map' },
  ...patch,
});

const read = async (b: Blob) => exifr.parse(new Uint8Array(await b.arrayBuffer()), { gps: true, translateValues: false });

describe('writeExif', () => {
  it('keeps the camera tags and replaces time and GPS with the stamped values', async () => {
    const tags = await read(await writeExif(jpeg(PLAIN_JPEG), original, meta({}), 1, 1));
    expect(tags.Make).toBe('Pixel');
    expect(tags.Orientation).toBe(1); // the canvas already rotated the pixels
    expect(tags.DateTimeOriginal).toEqual(new Date(2026, 10, 4, 14, 32, 8));
    expect(tags.latitude).toBeCloseTo(-8.43221, 5);
    expect(tags.longitude).toBeCloseTo(115.27904, 5);
    expect(tags.GPSAltitude).toBeUndefined(); // belonged to the old fix
  });

  it('keeps the rest of the GPS block when the location is still the photo’s own', async () => {
    const tags = await read(await writeExif(jpeg(PLAIN_JPEG), original, meta({ location: { lat: 1, lng: 2, source: 'exif' } }), 1, 1));
    expect(tags.GPSAltitude).toBe(120);
  });

  it('writes time and GPS onto a photo that had no EXIF', async () => {
    const png = new File(['x'], 'shot.png', { type: 'image/png' });
    const tags = await read(await writeExif(jpeg(PLAIN_JPEG), png, meta({}), 1, 1));
    expect(tags.DateTimeOriginal).toEqual(new Date(2026, 10, 4, 14, 32, 8));
    expect(tags.latitude).toBeCloseTo(-8.43221, 5);
  });

  it('returns the output unchanged rather than failing the export', async () => {
    const out = new Blob(['not a jpeg'], { type: 'image/jpeg' });
    expect(await writeExif(out, original, meta({}), 1, 1)).toBe(out);
  });

  describe('time zone', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });
    const own = { lat: 1, lng: 2, source: 'exif' as const };

    it('keeps the photo’s zone, sub-second and GPS fix time for the capture time', async () => {
      const tags = await read(await writeExif(jpeg(PLAIN_JPEG), original, meta({ timestampSource: 'capture', location: own }), 1, 1));
      expect(tags.OffsetTimeOriginal).toBe('+08:00');
      expect(tags.SubSecTimeOriginal).toBe('123');
      expect(tags.GPSDateStamp).toBe('2019:12:31');
    });

    it('drops them for a custom time, whose zone is unknown', async () => {
      const tags = await read(await writeExif(jpeg(PLAIN_JPEG), original, meta({ timestampSource: 'custom', location: own }), 1, 1));
      expect(tags.OffsetTimeOriginal).toBeUndefined();
      expect(tags.SubSecTimeOriginal).toBeUndefined();
      expect(tags.GPSDateStamp).toBeUndefined();
    });

    it('writes the browser’s zone for "now"', async () => {
      vi.stubEnv('TZ', 'Asia/Tokyo');
      const tags = await read(await writeExif(jpeg(PLAIN_JPEG), original, meta({ timestampSource: 'now' }), 1, 1));
      expect(tags.OffsetTimeOriginal).toBe('+09:00');
      expect(tags.SubSecTimeOriginal).toBeUndefined();
    });
  });

  it('leaves PNG output untouched', async () => {
    const out = new Blob(['png'], { type: 'image/png' });
    expect(await writeExif(out, original, meta({}), 1, 1)).toBe(out);
  });
});
