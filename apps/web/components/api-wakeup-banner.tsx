'use client';

import { useEffect, useState } from 'react';
import { registerApiWakeupCallback, unregisterApiWakeupCallback } from '@/lib/api/wakeup';

export function ApiWakeupBanner() {
  const [isWakingUp, setIsWakingUp] = useState(false);

  useEffect(() => {
    registerApiWakeupCallback(setIsWakingUp);
    return () => unregisterApiWakeupCallback();
  }, []);

  if (!isWakingUp) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-center gap-2.5 border-b border-amber bg-amber-tint px-4 py-2.5"
    >
      <span aria-hidden className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-amber-ink"
            style={{ animation: `wakeup-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </span>
      <p className="text-xs text-amber-ink">
        Waking up the server — hang tight, this only takes a moment
      </p>
      <style>{`
        @keyframes wakeup-pulse {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
