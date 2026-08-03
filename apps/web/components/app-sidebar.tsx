'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LogoIcon } from '@/components/icons';
import { BudgetReadout } from '@/components/budget-readout';
import { isNavItemActive, NAV_ITEMS } from '@/lib/nav';
import { FOCUS_RING } from '@/lib/focus-ring';

/**
 * Desktop navigation rail.
 *
 * The budget readout sits directly under the wordmark rather than at the floor.
 * It is the one element here that could not belong to some other product, and
 * as a footer widget it was last in reading order, last in tab order, and the
 * first thing to disappear when a request failed — in an app whose first
 * principle is that remaining budget stays legible on every surface. It leads
 * now, and the nav reads as the list of places you can take that number.
 *
 * The identity block that used to occupy this space is gone. BudgetBite is one
 * user per account: the rail spent seventy pixels and the loudest treatment on
 * the screen telling the user a fact never in question, directly above the
 * figure that was actually worth reading. Name and email still live in the
 * header's account menu, which is also where sign-out and Admin are.
 */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Sidebar"
      // z-30 keeps the rail under the sticky header (z-40) and the API-wakeup
      // banner (z-50). Unlayered, this `fixed` element was painted over the
      // banner announcing the very outage that empties it.
      className="fixed inset-y-0 left-0 z-30 hidden border-r border-sand bg-white text-charcoal lg:flex lg:w-64 lg:flex-col"
    >
      <Link
        href="/dashboard"
        className={`flex items-center gap-2.5 border-b border-sand px-6 py-5 ${FOCUS_RING}`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-deep text-white shadow-sm">
          <LogoIcon size={16} />
        </span>
        <span className="font-display text-lg font-bold tracking-tight">
          Budget<span className="text-teal-deep">Bite</span>
        </span>
      </Link>

      <div className="px-4 pb-1 pt-4">
        <BudgetReadout variant="rail" />
      </div>

      {/* The group label here was the word "Main" — a heading that named nothing
          above the only group in the rail. Five destinations with icons and
          labels do not need to be told they are the main ones. */}
      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${FOCUS_RING} ${
                isActive
                  ? 'bg-teal-tint font-semibold text-teal-deep'
                  : 'text-slate hover:bg-canvas hover:text-charcoal'
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  isActive ? 'bg-teal-deep text-white' : 'border border-sand bg-canvas text-slate'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
