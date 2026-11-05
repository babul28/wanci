import { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { UploadedPhoto, OverlayMetadata } from '../types';
import { drawOverlay, loadStampFont } from '../utils/drawOverlay';

interface PreviewCanvasProps {
  photo: UploadedPhoto;
  metadata: OverlayMetadata;
}

export const PreviewCanvas = ({ photo, metadata }: PreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fontReady, setFontReady] = useState(false);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    loadStampFont().then(() => live && setFontReady(true));
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !photo.bitmap) return;
    // Full resolution, so the preview matches the export exactly.
    canvas.width = photo.width;
    canvas.height = photo.height;
    ctx.drawImage(photo.bitmap, 0, 0, photo.width, photo.height);
    drawOverlay(ctx, photo.width, photo.height, metadata);
  }, [photo, metadata, fontReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const update = () => setScale(Math.round((canvas.clientWidth / photo.width) * 100));
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [photo.width]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-3 bg-bg p-4 lg:p-10">
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <canvas ref={canvasRef} className="max-h-full max-w-full object-contain" />
      </div>
      <div className="flex w-full items-center justify-between gap-3 text-xs text-ink-3">
        <span className="whitespace-nowrap font-mono">Preview{scale ? ` · ${scale}%` : ''}</span>
        <span className="flex items-center gap-1.5 text-ink-2">
          <ShieldCheck className="h-3.5 w-3.5 text-ok" aria-hidden />
          Exports at full {photo.width} × {photo.height}, original format
        </span>
      </div>
    </div>
  );
};
