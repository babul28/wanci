export const validateTimestamp = (timestamp: string): { isValid: boolean; error?: string } => {
  if (!timestamp.trim()) {
    return { isValid: false, error: 'Timestamp cannot be empty' };
  }
  if (isNaN(new Date(timestamp).getTime())) {
    return { isValid: false, error: 'Invalid date/time format' };
  }
  return { isValid: true };
};

const LIMIT = { lat: 90, lng: 180 } as const;

export const validateLocation = (p: { lat: number; lng: number }): { isValid: boolean; error?: string } => {
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) {
    return { isValid: false, error: 'Latitude and longitude must be numbers' };
  }
  if (Math.abs(p.lat) > LIMIT.lat || Math.abs(p.lng) > LIMIT.lng) {
    return { isValid: false, error: 'Latitude must be between -90 and 90, and longitude between -180 and 180' };
  }
  return { isValid: true };
};

/** Parses a typed coordinate. Accepts a comma decimal separator (e.g. `-8,43221`). */
export const parseCoordinate = (input: string, axis: 'lat' | 'lng'): number | null => {
  const s = input.trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && Math.abs(n) <= LIMIT[axis] ? n : null;
};
