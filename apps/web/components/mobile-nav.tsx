'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isNavItemActive, NAV_ITEMS } from '@/lib/nav';
import { FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';

/**
 * Bottom tab bar, below `lg`. This is the whole of navigation on a phone — the
 * rail is `hidden` there — so it renders the same `NAV_ITEMS` the rail does.
 * Hand-copied, the two lists had already drifted: the rail appended an Admin
 * item for admins and this did not, so an admin on a phone had no route to
 * `/admin` at all, on a product that treats neither device as the real one.
 * Admin now lives in the account menu, which both devices share.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-sage bg-white/95 lg:hidden"
      style={{ backdropFilter: 'saturate(180%) blur(10px)' }}
    >
      <div className="flex items-stretch justify-around px-1 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 transition-colors ${FOCUS_RING_ON_CANVAS} ${
                isActive ? 'text-green-deep' : 'text-slate hover:text-green-deep'
              }`}
            >
              {/* Active is a filled chip, not a hue swap. A colour change alone
                  between two tokens of similar lightness is close to invisible
                  at this size in daylight, which is the actual usage scene. */}
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  isActive ? 'bg-green-deep text-white' : 'text-slate'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span
                className={`w-full truncate text-center text-[11px] tracking-tight ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="bg-white" style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
}
