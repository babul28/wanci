import { UploadedPhoto } from '../types';

export const loadPhoto = async (file: File): Promise<UploadedPhoto> => {
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    throw new Error('Please upload a valid JPEG or PNG image.');
  }
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('Failed to process image. Please try another file.');
  });
  return {
    file,
    name: file.name,
    type: file.type,
    width: bitmap.width,
    height: bitmap.height,
    size: file.size,
    srcUrl: URL.createObjectURL(file),
    bitmap,
  };
};
