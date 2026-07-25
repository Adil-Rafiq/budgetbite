'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  CalendarDays,
  Store,
  BarChart3,
  User as UserIcon,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Same route vocabulary as the desktop sidebar — one name per destination so
// switching between phone and desktop never renames the same place.
const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/plans', label: 'Plans', icon: CalendarDays },
  { href: '/restaurants', label: 'Restaurants', icon: Store },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: UserIcon },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-sage bg-white/95 lg:hidden"
      style={{ backdropFilter: 'saturate(180%) blur(10px)' }}
    >
      <div className="flex items-stretch justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 ${
                isActive ? 'text-green' : 'text-slate hover:text-green'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span
                className={`w-full truncate text-center text-[10px] tracking-tight ${
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
