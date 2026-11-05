import { UploadedPhoto } from '../types';
import { readExif } from '../services/exif';

export const loadPhoto = async (file: File): Promise<UploadedPhoto> => {
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    throw new Error('Please upload a valid JPEG or PNG image.');
  }
  const [bitmap, exif] = await Promise.all([
    createImageBitmap(file).catch(() => {
      throw new Error('Failed to process image. Please try another file.');
    }),
    readExif(file),
  ]);
  return {
    file,
    name: file.name,
    type: file.type,
    width: bitmap.width,
    height: bitmap.height,
    size: file.size,
    srcUrl: URL.createObjectURL(file),
    bitmap,
    exif,
  };
};
