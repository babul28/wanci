import React, { useEffect, useRef } from 'react';
import { UploadedPhoto, OverlayMetadata } from '../types';

interface PreviewCanvasProps {
  photo: UploadedPhoto;
  metadata: OverlayMetadata;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ photo, metadata }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photo.bitmap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use full image dimensions so the preview matches export exactly
    canvas.width = photo.width;
    canvas.height = photo.height;

    // Draw image
    ctx.drawImage(photo.bitmap, 0, 0, photo.width, photo.height);
    
    // Draw overlay
    ctx.font = `${metadata.fontSize}px Arial, sans-serif`;
    ctx.fillStyle = metadata.color;
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = Math.max(2, metadata.fontSize * 0.1);
    ctx.shadowOffsetX = Math.max(1, metadata.fontSize * 0.05);
    ctx.shadowOffsetY = Math.max(1, metadata.fontSize * 0.05);
    
    const padding = Math.max(photo.width, photo.height) * 0.02;
    
    const text1 = metadata.timestamp;
    const text2 = metadata.location;
    
    let x = padding;
    let y = padding + metadata.fontSize;
    
    const lineHeight = metadata.fontSize * 1.2;
    const totalHeight = lineHeight * 2;
    
    if (metadata.position.includes('bottom')) {
      y = photo.height - padding - totalHeight + metadata.fontSize;
    }
    
    if (metadata.position.includes('right')) {
      ctx.textAlign = 'right';
      x = photo.width - padding;
    } else {
      ctx.textAlign = 'left';
    }
    
    ctx.fillText(text1, x, y);
    ctx.fillText(text2, x, y + lineHeight);
    
  }, [photo, metadata]);

  return (
    <div className="w-full flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-[70vh] object-contain shadow-sm"
      />
    </div>
  );
};
