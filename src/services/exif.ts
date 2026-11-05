import exifr from 'exifr';
import piexif from 'piexifjs';
import { OverlayMetadata, PhotoExif } from '../types';
import { toLocalInput } from '../utils/metadata';

/** Capture time and GPS from the photo. Never rejects: a photo without EXIF just yields `{}`. */
export const readExif = async (file: File): Promise<PhotoExif> => {
  try {
    const [gps, tags] = await Promise.all([exifr.gps(file), exifr.parse(file, ['DateTimeOriginal'])]);
    const out: PhotoExif = {};
    // exifr returns EXIF's zone-less DateTimeOriginal as a local Date, so local getters give the camera's wall clock.
    const d = tags?.DateTimeOriginal;
    if (d instanceof Date && !isNaN(d.getTime())) out.capturedAt = toLocalInput(d);
    const lat = gps?.latitude;
    const lng = gps?.longitude;
    // Some phones write 0,0 when they had no fix.
    if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) out.gps = { lat, lng };
    return out;
  } catch {
    return {};
  }
};

// piexif works on binary strings, one char per byte.
const toBinary = async (b: Blob) => {
  const bytes = new Uint8Array(await b.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return s;
};
const fromBinary = (s: string) => {
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
};

// piexifjs predates EXIF 2.31 and silently drops tags it doesn't know, so teach it the zone tags.
const OFFSET_TAGS = { OffsetTime: 36880, OffsetTimeOriginal: 36881, OffsetTimeDigitized: 36882 };
for (const [name, tag] of Object.entries(OFFSET_TAGS)) piexif.TAGS.Exif[tag] = { name, type: 'Ascii' };

/** The browser's UTC offset at that wall-clock time, as EXIF writes it: `+07:00`. */
const browserOffset = (timestamp: string) => {
  const min = -new Date(timestamp).getTimezoneOffset(); // zone-less ISO parses as local time, DST included
  const abs = Math.abs(min);
  return `${min < 0 ? '-' : '+'}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
};

const stamp = (exif: piexif.ExifDict, m: OverlayMetadata, width: number, height: number): string => {
  const { ImageIFD, ExifIFD, GPSIFD, GPSHelper } = piexif;
  const date = m.timestamp.replace(/-/g, ':').replace('T', ' '); // EXIF wants YYYY:MM:DD HH:mm:ss, local time like ours
  const loc = m.location;
  const exifIfd: Record<number, unknown> = {
    ...exif.Exif,
    [ExifIFD.DateTimeOriginal]: date,
    [ExifIFD.DateTimeDigitized]: date,
    [ExifIFD.PixelXDimension]: width,
    [ExifIFD.PixelYDimension]: height,
  };
  // Altitude, fix time etc. describe the photo's own fix: keep them only while the location still is that fix.
  const gps: Record<number, unknown> = loc?.source === 'exif' ? { ...exif.GPS } : {};
  if (m.timestampSource !== 'capture') {
    // The photo's zone, sub-second and GPS fix time belong to the old time. "now" is in the browser's zone; a custom time's zone is unknown.
    const stale = [ExifIFD.SubSecTime, ExifIFD.SubSecTimeOriginal, ExifIFD.SubSecTimeDigitized, ...Object.values(OFFSET_TAGS)];
    for (const tag of stale) delete exifIfd[tag];
    delete gps[GPSIFD.GPSDateStamp];
    delete gps[GPSIFD.GPSTimeStamp];
    if (m.timestampSource === 'now') for (const tag of Object.values(OFFSET_TAGS)) exifIfd[tag] = browserOffset(m.timestamp);
  }
  return piexif.dump({
    ...exif,
    '0th': { ...exif['0th'], [ImageIFD.Orientation]: 1, [ImageIFD.DateTime]: date }, // the canvas already applied the rotation
    Exif: exifIfd,
    GPS: loc
      ? {
          ...gps,
          [GPSIFD.GPSVersionID]: [2, 3, 0, 0],
          [GPSIFD.GPSLatitudeRef]: loc.lat < 0 ? 'S' : 'N',
          [GPSIFD.GPSLatitude]: GPSHelper.degToDmsRational(Math.abs(loc.lat)),
          [GPSIFD.GPSLongitudeRef]: loc.lng < 0 ? 'W' : 'E',
          [GPSIFD.GPSLongitude]: GPSHelper.degToDmsRational(Math.abs(loc.lng)),
        }
      : {},
    '1st': {}, // the embedded thumbnail is the un-stamped photo
    thumbnail: undefined,
  });
};

/**
 * The exported JPEG with the original photo's EXIF, its time and GPS replaced by the stamped values. Never rejects.
 * ponytail: PNG export goes out without EXIF; write an eXIf chunk if PNG users need it.
 */
export const writeExif = async (out: Blob, original: File, m: OverlayMetadata, width: number, height: number): Promise<Blob> => {
  if (out.type !== 'image/jpeg') return out;
  let exif: piexif.ExifDict = {};
  try {
    if (original.type === 'image/jpeg') exif = piexif.load(await toBinary(original));
  } catch {
    // unreadable EXIF: write ours alone
  }
  try {
    let segment: string;
    try {
      segment = stamp(exif, m, width, height);
    } catch {
      segment = stamp({}, m, width, height); // some vendor tag piexif can't re-encode
    }
    return new Blob([fromBinary(piexif.insert(segment, await toBinary(out)))], { type: 'image/jpeg' });
  } catch {
    return out; // metadata is extra: never fail the export over it
  }
};
