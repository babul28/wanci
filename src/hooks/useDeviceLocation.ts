import { useCallback, useEffect, useRef, useState } from 'react';
import { GeoPoint } from '../types';
import { DeviceStatus, geoErrorToStatus, getDevicePosition } from '../services/location';

export const useDeviceLocation = (onFix: (p: GeoPoint) => void) => {
  const [status, setStatus] = useState<DeviceStatus>({ kind: 'idle' });
  const request = useRef(0); // bumping it discards whatever is in flight
  const fix = useRef(onFix);
  fix.current = onFix;

  useEffect(() => () => void request.current++, []);

  const locate = useCallback(() => {
    const id = ++request.current;
    setStatus({ kind: 'locating' });
    getDevicePosition().then(
      (p) => {
        if (id !== request.current) return;
        setStatus({ kind: 'idle' });
        fix.current(p);
      },
      (s: unknown) => {
        if (id !== request.current) return;
        setStatus(s && typeof s === 'object' && 'kind' in s ? (s as DeviceStatus) : geoErrorToStatus(2));
      },
    );
  }, []);

  const cancel = useCallback(() => {
    request.current++;
    setStatus({ kind: 'idle' });
  }, []);

  return { status, locate, cancel };
};
