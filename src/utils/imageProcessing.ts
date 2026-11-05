import { UploadedPhoto, OverlayMetadata, ExportResult } from '../types';
import { drawOverlay, loadStampFont } from './drawOverlay';
import { loadStaticMap } from '../services/staticMap';

export const processImage = async (photo: UploadedPhoto, metadata: OverlayMetadata): Promise<ExportResult> => {
  const { location, showMap } = metadata;
  const [bitmap, , map] = await Promise.all([
    photo.bitmap ?? createImageBitmap(photo.file),
    loadStampFont(),
    // ponytail: offline export goes out without the map (the preview shows the same); block export if proof needs it
    showMap && location ? loadStaticMap(location.lat, location.lng) : null,
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = photo.width;
  canvas.height = photo.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(bitmap, 0, 0, photo.width, photo.height);
  drawOverlay(ctx, photo.width, photo.height, metadata, map);

  const mimeType = photo.type;
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, mimeType === 'image/jpeg' ? 1.0 : undefined),
  );
  if (!blob) throw new Error('Canvas toBlob failed');

  const fileExt = mimeType === 'image/jpeg' ? 'jpg' : 'png';
  return {
    blob,
    downloadUrl: URL.createObjectURL(blob),
    fileName: `${photo.name.replace(/\.[^/.]+$/, '')}_edited.${fileExt}`,
    mimeType,
  };
};
