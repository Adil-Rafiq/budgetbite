'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const SOFT = '#a6a691';

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
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{
        background: 'rgba(255,255,235,0.95)',
        backdropFilter: 'saturate(180%) blur(10px)',
        borderTop: `1px solid ${LUMEN_DK}`,
      }}
    >
      <div className="flex items-stretch justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5"
              style={{
                color: isActive ? VAST : SOFT,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  color: isActive ? FATHOM : SOFT,
                }}
              >
                {item.code}
              </span>
              <span
                className="text-[12px]"
                style={{
                  color: isActive ? VAST : SOFT,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {item.label}
              </span>
              <span
                className="mt-0.5 inline-block h-0.5 w-6 rounded-full"
                style={{ background: isActive ? FATHOM : 'transparent' }}
              />
            </Link>
          );
        })}
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom)', background: LUMEN }} />
    </nav>
  );
}
