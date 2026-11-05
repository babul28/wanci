import { OverlayMetadata, PhotoExif } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local wall-clock time as `YYYY-MM-DDTHH:mm:ss` (no timezone shift). */
export const toLocalInput = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/** datetime-local inputs drop `:ss` when it is zero and may add `.mmm`; keep exactly `YYYY-MM-DDTHH:mm:ss`. */
export const normalizeLocalInput = (v: string): string => (v.length === 16 ? `${v}:00` : v.slice(0, 19));

export const formatStampTime = (ts: string): string => ts.replace('T', ' ');

export const DEFAULT_STYLE = { fontSize: 48, color: '#FF7A1A', position: 'bottom-right' } as const;

export const defaultMetadata = (exif: PhotoExif | undefined, now: Date): OverlayMetadata => ({
  timestamp: exif?.capturedAt ?? toLocalInput(now),
  timestampSource: exif?.capturedAt ? 'capture' : 'now',
  location: exif?.gps ? { ...exif.gps, source: 'exif' } : null,
  placeName: null,
  showCoords: true,
  showPlace: true,
  ...DEFAULT_STYLE,
});

/** Settings for the next photo: keep `prev`, except the new photo's EXIF wins and a carried Now refreshes. */
export const carryOver = (prev: OverlayMetadata, exif: PhotoExif | undefined, now: Date): OverlayMetadata => {
  const m = { ...prev };
  if (exif?.gps) {
    m.location = { ...exif.gps, source: 'exif' };
    m.placeName = null;
  }
  if (exif?.capturedAt) {
    m.timestamp = exif.capturedAt;
    m.timestampSource = 'capture';
  } else if (prev.timestampSource === 'now') {
    m.timestamp = toLocalInput(now);
  }
  return m;
};
