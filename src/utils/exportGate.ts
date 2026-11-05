import { OverlayMetadata, SectionId } from '../types';
import { validateTimestamp } from './validation';

export type ExportBlock = 'location' | 'time' | 'lines';

/** Why export is blocked, or null when the stamp will print a time and at least one location line. */
export const exportBlocker = (m: OverlayMetadata): ExportBlock | null => {
  if (!m.location) return 'location';
  if (!validateTimestamp(m.timestamp).isValid) return 'time';
  if (!m.showCoords && !(m.showPlace && m.placeName)) return 'lines';
  return null;
};

export const BLOCK_REASON: Record<ExportBlock, string> = {
  location: 'Add a location to export',
  time: 'Add a time to export',
  lines: 'Turn on coordinates or place name',
};

export const BLOCK_SECTION: Record<ExportBlock, SectionId> = {
  location: 'location',
  time: 'time',
  lines: 'location',
};
