import { useEffect, useRef, useState } from 'react';
import { GeoPoint } from '../types';
import { cachedPlaceName, reverseGeocode } from '../services/location';

export type PlaceStatus = 'idle' | 'pending' | 'ok' | 'failed';

/** Reverse-geocodes `location` 800 ms after it last changed (by reference). Late results for an old location are dropped. */
export const usePlaceName = (location: GeoPoint | null, setPlaceName: (n: string | null) => void): PlaceStatus => {
  const [status, setStatus] = useState<PlaceStatus>('idle');
  const set = useRef(setPlaceName);
  set.current = setPlaceName;

  useEffect(() => {
    if (!location) {
      set.current(null);
      setStatus('idle');
      return;
    }
    const hit = cachedPlaceName(location.lat, location.lng);
    if (hit) {
      set.current(hit);
      setStatus('ok');
      return;
    }
    set.current(null);
    setStatus('pending');
    let live = true;
    const timer = setTimeout(() => {
      reverseGeocode(location.lat, location.lng).then((name) => {
        if (!live) return;
        set.current(name);
        setStatus(name ? 'ok' : 'failed');
      });
    }, 800);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [location]);

  return status;
};
