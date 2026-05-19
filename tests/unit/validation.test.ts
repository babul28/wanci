import { describe, it, expect } from 'vitest';
import { validateTimestamp, validateLocation } from '../../src/utils/validation';

describe('validation', () => {
  describe('validateTimestamp', () => {
    it('should validate a correct timestamp', () => {
      expect(validateTimestamp('2026-05-19 14:30:00').isValid).toBe(true);
    });
    
    it('should fail on empty timestamp', () => {
      expect(validateTimestamp('   ').isValid).toBe(false);
    });
    
    it('should fail on invalid date format', () => {
      expect(validateTimestamp('not-a-date').isValid).toBe(false);
    });
  });

  describe('validateLocation', () => {
    it('should validate correct coordinates', () => {
      expect(validateLocation('40.7128, -74.0060').isValid).toBe(true);
      expect(validateLocation('40.7128° N, 74.0060° W').isValid).toBe(true);
    });
    
    it('should fail on empty location', () => {
      expect(validateLocation('').isValid).toBe(false);
    });
    
    it('should fail if missing numbers', () => {
      expect(validateLocation('New York').isValid).toBe(false);
    });
    
    it('should fail on out of bounds coordinates', () => {
      expect(validateLocation('100.0, 0.0').isValid).toBe(false); // Lat > 90
      expect(validateLocation('0.0, 200.0').isValid).toBe(false); // Lng > 180
    });
  });
});
