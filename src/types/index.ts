export interface UploadedPhoto {
  file: File;
  name: string;
  type: 'image/jpeg' | 'image/png';
  width: number;
  height: number;
  size: number;
  srcUrl: string;
  bitmap?: ImageBitmap;
}

export interface OverlayMetadata {
  timestamp: string;
  location: string;
  fontSize: number;
  color: string;
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export interface ExportResult {
  blob: Blob;
  downloadUrl: string;
  fileName: string;
  mimeType: string;
}
