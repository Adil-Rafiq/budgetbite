'use client';

import { useEffect, useState } from 'react';
import { registerApiWakeupCallback, unregisterApiWakeupCallback } from '@/lib/api/wakeup';

export function ApiWakeupBanner() {
  const [isWakingUp, setIsWakingUp] = useState(false);

  useEffect(() => {
    registerApiWakeupCallback(setIsWakingUp);
    return () => unregisterApiWakeupCallback();
  }, []);

  if (!isWakingUp) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950 shadow-sm">
      Waking up the service… first request may take a few seconds.
    </div>
  );
}
