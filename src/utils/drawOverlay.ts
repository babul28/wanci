import { OverlayMetadata } from '../types';
import { formatStampTime } from './metadata';

/** The lines the stamp prints, top to bottom. */
export const stampLines = (m: OverlayMetadata): string[] => {
  const lines = [formatStampTime(m.timestamp)];
  if (m.showCoords && m.location) lines.push(`${m.location.lat.toFixed(5)}, ${m.location.lng.toFixed(5)}`);
  if (m.showPlace && m.location && m.placeName) lines.push(m.placeName);
  return lines;
};

/** Draws the text stamp. The photo must already be drawn. Shared by preview and export. */
export const drawOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number, m: OverlayMetadata): void => {
  const lines = stampLines(m);
  const padding = Math.max(width, height) * 0.02;
  const lineHeight = m.fontSize * 1.2;

  ctx.font = `${m.fontSize}px "Geist Mono", ui-monospace, monospace`;
  ctx.fillStyle = m.color;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = Math.max(2, m.fontSize * 0.1);
  ctx.shadowOffsetX = Math.max(1, m.fontSize * 0.05);
  ctx.shadowOffsetY = Math.max(1, m.fontSize * 0.05);

  const right = m.position.endsWith('right');
  ctx.textAlign = right ? 'right' : 'left';
  const x = right ? width - padding : padding;
  const firstY = m.position.startsWith('top')
    ? padding + m.fontSize
    : height - padding - (lines.length - 1) * lineHeight;

  lines.forEach((line, i) => ctx.fillText(line, x, firstY + i * lineHeight));
};

let fontReady: Promise<void> | undefined;

/** Resolves once Geist Mono is loaded (or immediately when the Font Loading API is missing). Never rejects. */
export const loadStampFont = (): Promise<void> =>
  (fontReady ??= (document.fonts?.load('48px "Geist Mono"') ?? Promise.resolve())
    .then(() => undefined, () => undefined));
