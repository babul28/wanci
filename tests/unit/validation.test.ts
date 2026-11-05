import { describe, it, expect } from 'vitest';
import { validateTimestamp, validateLocation, parseCoordinate } from '../../src/utils/validation';

describe('validateTimestamp', () => {
  it('accepts a valid timestamp', () => {
    expect(validateTimestamp('2026-05-19 14:30:00').isValid).toBe(true);
    expect(validateTimestamp('2026-11-05T14:32:08').isValid).toBe(true);
  });
  it('rejects an empty timestamp', () => {
    expect(validateTimestamp('   ').isValid).toBe(false);
  });
  it('rejects an invalid date format', () => {
    expect(validateTimestamp('not-a-date').isValid).toBe(false);
  });
});

describe('validateLocation', () => {
  it('accepts in-range numbers', () => {
    expect(validateLocation({ lat: 40.7, lng: -74 }).isValid).toBe(true);
  });
  it('rejects out-of-range and NaN', () => {
    expect(validateLocation({ lat: 91, lng: 0 }).isValid).toBe(false);
    expect(validateLocation({ lat: 0, lng: 181 }).isValid).toBe(false);
    expect(validateLocation({ lat: NaN, lng: 0 }).isValid).toBe(false);
  });
});

describe('parseCoordinate', () => {
  it('parses dots, commas and whitespace', () => {
    expect(parseCoordinate('-8.43221', 'lat')).toBe(-8.43221);
    expect(parseCoordinate('-8,43221', 'lat')).toBe(-8.43221); // Review Focus 1
    expect(parseCoordinate(' 115.27904 ', 'lng')).toBe(115.27904);
  });
  it('rejects empty, garbage and out-of-range input', () => {
    expect(parseCoordinate('', 'lat')).toBeNull();
    expect(parseCoordinate('abc', 'lat')).toBeNull();
    expect(parseCoordinate('95', 'lat')).toBeNull();
    expect(parseCoordinate('-181', 'lng')).toBeNull();
  });
});
