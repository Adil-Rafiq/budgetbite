'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  CalendarDays,
  BarChart3,
  User as UserIcon,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutGrid },
  { href: '/plans', label: 'Plans', icon: CalendarDays },
  { href: '/analytics', label: 'Stats', icon: BarChart3 },
  { href: '/profile', label: 'Me', icon: UserIcon },
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
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-colors ${
                isActive ? 'text-green' : 'text-slate hover:text-green'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
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
