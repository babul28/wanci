import exifr from 'exifr';
import { PhotoExif } from '../types';
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
