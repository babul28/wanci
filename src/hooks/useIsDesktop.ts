import { useEffect, useState } from 'react';

const QUERY = '(min-width: 1024px)';

/** True at the `lg` breakpoint. Use only where behaviour differs; layout differences belong in CSS. */
export const useIsDesktop = (): boolean => {
  const [desktop, setDesktop] = useState(() => window.matchMedia?.(QUERY).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return;
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desktop;
};
