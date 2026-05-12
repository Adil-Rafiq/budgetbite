'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Home', code: '01' },
  { href: '/plans', label: 'Plans', code: '02' },
  { href: '/analytics', label: 'Stats', code: '03' },
  { href: '/profile', label: 'Me', code: '04' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-lumen-dk bg-lumen/95 lg:hidden"
      style={{ backdropFilter: 'saturate(180%) blur(10px)' }}
    >
      <div className="flex items-stretch justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 ${
                isActive ? 'text-vast' : 'text-soft'
              }`}
            >
              <span
                className={`text-[10px] ${isActive ? 'text-fathom' : 'text-soft'}`}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.16em' }}
              >
                {item.code}
              </span>
              <span
                className={`text-[12px] ${isActive ? 'font-semibold text-vast' : 'font-normal text-soft'}`}
              >
                {item.label}
              </span>
              <span
                className={`mt-0.5 inline-block h-0.5 w-6 rounded-full ${
                  isActive ? 'bg-fathom' : 'bg-transparent'
                }`}
              />
            </Link>
          );
        })}
      </div>
      <div className="bg-lumen" style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
}
