// 'use client';

// import { useEffect, useState } from 'react';
// import { registerApiWakeupCallback, unregisterApiWakeupCallback } from '@/lib/api/wakeup';

// export function ApiWakeupBanner() {
//   const [isWakingUp, setIsWakingUp] = useState(false);

//   useEffect(() => {
//     registerApiWakeupCallback(setIsWakingUp);
//     return () => unregisterApiWakeupCallback();
//   }, []);

//   //   if (!isWakingUp) return null;

//   return (
//     <div className="sticky top-0 z-50 flex items-center justify-center gap-2.5 border-b border-border bg-background px-4 py-2.5">
//       <span className="flex items-center gap-1">
//         {[0, 1, 2].map((i) => (
//           <span
//             key={i}
//             className="size-1.5 rounded-full bg-amber-400"
//             style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
//           />
//         ))}
//       </span>
//       <p className="text-xs text-muted-foreground">
//         Waking up the server — hang tight, this only happens once
//       </p>
//       <style>{`
//         @keyframes pulse {
//           0%, 100% { opacity: 0.25; transform: scale(0.85); }
//           50% { opacity: 1; transform: scale(1); }
//         }
//       `}</style>
//     </div>
//   );
// }

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
      className="sticky top-0 z-50 flex items-center justify-center gap-2.5 border-b px-4 py-2.5"
      style={{ background: 'var(--color-lumen)', borderColor: 'var(--color-lumen-dk)' }}
    >
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full"
            style={{
              background: 'var(--color-amber)',
              animation: `wakeup-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </span>
      <p className="text-xs" style={{ color: 'var(--color-ink)' }}>
        Waking up the server — hang tight, this only happens once
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
