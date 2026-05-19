import { UploadedPhoto, OverlayMetadata, ExportResult } from '../types';

export const processImage = async (
  photo: UploadedPhoto,
  metadata: OverlayMetadata
): Promise<ExportResult> => {
  return new Promise(async (resolve, reject) => {
    try {
      const bitmap = photo.bitmap || await createImageBitmap(photo.file);
      
      const canvas = document.createElement('canvas');
      canvas.width = photo.width;
      canvas.height = photo.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Draw image
      ctx.drawImage(bitmap, 0, 0, photo.width, photo.height);
      
      // Draw overlay
      ctx.font = `${metadata.fontSize}px Arial, sans-serif`;
      ctx.fillStyle = metadata.color;
      
      // Add a subtle shadow for better readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = Math.max(2, metadata.fontSize * 0.1);
      ctx.shadowOffsetX = Math.max(1, metadata.fontSize * 0.05);
      ctx.shadowOffsetY = Math.max(1, metadata.fontSize * 0.05);
      
      const padding = Math.max(photo.width, photo.height) * 0.02; // 2% padding
      
      // Format text
      const text1 = metadata.timestamp;
      const text2 = metadata.location;
      
      let x = padding;
      let y = padding + metadata.fontSize;
      
      // const text1Metrics = ctx.measureText(text1);
      // const text2Metrics = ctx.measureText(text2);
      
      const lineHeight = metadata.fontSize * 1.2;
      const totalHeight = lineHeight * 2;
      
      if (metadata.position.includes('bottom')) {
        y = photo.height - padding - totalHeight + metadata.fontSize;
      }
      if (metadata.position.includes('right')) {
        // Right align text
        ctx.textAlign = 'right';
        x = photo.width - padding;
      } else {
        ctx.textAlign = 'left';
      }
      
      ctx.fillText(text1, x, y);
      ctx.fillText(text2, x, y + lineHeight);
      
      // Export
      const mimeType = photo.type;
      const quality = mimeType === 'image/jpeg' ? 1.0 : undefined;
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob failed'));
          return;
        }
        
        const downloadUrl = URL.createObjectURL(blob);
        const fileExt = mimeType === 'image/jpeg' ? 'jpg' : 'png';
        const fileName = `${photo.name.replace(/\.[^/.]+$/, "")}_edited.${fileExt}`;
        
        resolve({
          blob,
          downloadUrl,
          fileName,
          mimeType
        });
      }, mimeType, quality);
      
    } catch (error) {
      reject(error);
    }
  });
};
