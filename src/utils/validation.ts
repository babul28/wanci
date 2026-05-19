export const validateTimestamp = (timestamp: string): { isValid: boolean; error?: string } => {
  if (!timestamp.trim()) {
    return { isValid: false, error: 'Timestamp cannot be empty' };
  }
  const parsed = new Date(timestamp);
  if (isNaN(parsed.getTime())) {
    return { isValid: false, error: 'Invalid date/time format' };
  }
  return { isValid: true };
};

export const validateLocation = (location: string): { isValid: boolean; error?: string } => {
  if (!location.trim()) {
    return { isValid: false, error: 'Location cannot be empty' };
  }
  // Simple check for at least two numbers which could represent lat/long
  const matches = location.match(/-?\d+(\.\d+)?/g);
  if (!matches || matches.length < 2) {
    return { isValid: false, error: 'Location must contain latitude and longitude numbers' };
  }
  
  // Basic range check for the first two numbers (assuming lat, long)
  const lat = parseFloat(matches[0]);
  const lng = parseFloat(matches[1]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { isValid: false, error: 'Latitude must be between -90 and 90, and longitude between -180 and 180' };
  }

  return { isValid: true };
};
