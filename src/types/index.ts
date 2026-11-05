export type LocationSource = 'exif' | 'device' | 'map' | 'manual';

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracy?: number; // metres, device fixes only
  source: LocationSource;
}

export type TimestampSource = 'capture' | 'now' | 'custom';

export interface PhotoExif {
  capturedAt?: string; // datetime-local, YYYY-MM-DDTHH:mm:ss
  gps?: { lat: number; lng: number };
}

export interface UploadedPhoto {
  file: File;
  name: string;
  type: 'image/jpeg' | 'image/png';
  width: number;
  height: number;
  size: number;
  srcUrl: string;
  bitmap?: ImageBitmap;
  exif?: PhotoExif;
}

export interface OverlayMetadata {
  timestamp: string; // always datetime-local, YYYY-MM-DDTHH:mm:ss
  timestampSource: TimestampSource;
  location: GeoPoint | null;
  placeName: string | null;
  showCoords: boolean;
  showPlace: boolean;
  showMap: boolean;
  fontSize: number;
  color: string;
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export type Patch = Partial<OverlayMetadata>;

export type SectionId = 'time' | 'location' | 'style';

export interface ExportResult {
  blob: Blob;
  downloadUrl: string;
  fileName: string;
  mimeType: string;
}
