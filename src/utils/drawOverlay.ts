import { OverlayMetadata } from '../types';
import { formatStampTime } from './metadata';

/** The lines the stamp prints, top to bottom. */
export const stampLines = (m: OverlayMetadata): string[] => {
  const lines = [formatStampTime(m.timestamp)];
  if (m.showCoords && m.location) lines.push(`${m.location.lat.toFixed(5)}, ${m.location.lng.toFixed(5)}`);
  if (m.showPlace && m.location && m.placeName) lines.push(m.placeName);
  return lines;
};

/**
 * Draws the stamp: optional map, then the text lines. The photo must already be drawn.
 * Shared by preview and export; `map` comes from `loadStaticMap` and is skipped while it is null.
 */
export const drawOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  m: OverlayMetadata,
  map?: CanvasImageSource | null,
): void => {
  const lines = stampLines(m);
  const padding = Math.max(width, height) * 0.02;
  const lineHeight = m.fontSize * 1.2;
  const withMap = !!(m.showMap && m.location && map);
  const mapH = m.fontSize * 5;
  const mapW = mapH * 1.6; // 8:5, matches MAP_W × MAP_H
  const gap = m.fontSize * 0.4;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = Math.max(2, m.fontSize * 0.1);
  ctx.shadowOffsetX = Math.max(1, m.fontSize * 0.05);
  ctx.shadowOffsetY = Math.max(1, m.fontSize * 0.05);

  const right = m.position.endsWith('right');
  const top = m.position.startsWith('top');
  const x = right ? width - padding : padding;
  const firstY = top
    ? padding + m.fontSize + (withMap ? mapH + gap : 0)
    : height - padding - (lines.length - 1) * lineHeight;

  ctx.font = `${m.fontSize}px "Geist Mono", ui-monospace, monospace`;
  ctx.fillStyle = m.color;
  ctx.textAlign = right ? 'right' : 'left';
  lines.forEach((line, i) => ctx.fillText(line, x, firstY + i * lineHeight));

  if (!withMap) return;
  const mapX = right ? width - padding - mapW : padding;
  const mapY = top ? padding : firstY - m.fontSize - gap - mapH;
  ctx.drawImage(map!, mapX, mapY, mapW, mapH);
  // OSM tile policy: the credit must be visible on the image itself.
  const inset = mapH * 0.03;
  ctx.font = `${Math.max(8, mapH * 0.06)}px "Geist Mono", ui-monospace, monospace`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'right';
  ctx.fillText('© OpenStreetMap', mapX + mapW - inset, mapY + mapH - inset);
};

let fontReady: Promise<void> | undefined;

/** Resolves once Geist Mono is loaded (or immediately when the Font Loading API is missing). Never rejects. */
export const loadStampFont = (): Promise<void> =>
  (fontReady ??= (document.fonts?.load('48px "Geist Mono"') ?? Promise.resolve())
    .then(() => undefined, () => undefined));
