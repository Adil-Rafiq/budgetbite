'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Inter, JetBrains_Mono, Bricolage_Grotesque } from 'next/font/google';
import { useUser } from '@/hooks/use-user';
import { authClient } from '@/lib/auth-client';
import { LogoIcon } from '@/components/icons';

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz'],
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

// Admin nav. Add an item here when a new admin resource page lands.
const navItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/restaurants', label: 'Restaurants' },
  { href: '/admin/meal-types', label: 'Meal types' },
  { href: '/admin/ingestion', label: 'Ingestion' },
  { href: '/admin/audit', label: 'Audit log' },
];

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useUser();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.push('/login');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div
      className={`${body.variable} ${display.variable} ${mono.variable} min-h-screen bg-lumen text-vast antialiased`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <aside className="fixed inset-y-0 hidden border-r border-lumen-dk bg-lumen text-vast lg:flex lg:w-64 lg:flex-col">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 border-b border-lumen-dk px-6 py-6"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-fathom text-lumen">
            <LogoIcon />
          </span>
          <span className="flex flex-col leading-none">
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              BudgetBite
            </span>
            <span
              className="mt-1 text-[10px] uppercase text-soft"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              admin
            </span>
          </span>
        </Link>

        <div
          className="px-6 pt-5 pb-2 text-[10px] uppercase text-soft"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
        >
          manage
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const active = isItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg border px-3 py-2 text-[14px] transition-colors ${
                  active
                    ? 'border-lumen-dk bg-white font-medium text-vast shadow-[0_1px_0_rgba(0,0,0,0.03)]'
                    : 'border-transparent bg-transparent font-normal text-ink hover:bg-lumen hover:text-vast'
                }`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full transition-colors group-hover:bg-soft ${
                    active ? 'border-0 bg-fathom' : 'border border-soft bg-transparent'
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3 px-4 pb-4 pt-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-lumen-dk bg-white px-3 py-2 text-[13px] text-ink transition-colors hover:text-vast"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Link>
          <div className="flex items-center gap-3 rounded-xl border border-lumen-dk bg-white px-3 py-2.5">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-medium text-vast">
                {user?.name ?? '—'}
              </span>
              <span
                className="truncate text-[11px] text-soft"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {user?.email ?? ''}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header
          className="sticky top-0 z-40 border-b border-lumen-dk bg-lumen/85"
          style={{ backdropFilter: 'saturate(180%) blur(10px)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 lg:px-8 lg:py-4">
            <div
              className="text-[11px] uppercase text-soft"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              admin
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-[12px] text-ink transition-colors hover:text-vast lg:hidden"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                App
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center gap-1.5 rounded-full border border-lumen-dk bg-white px-3 py-1.5 text-[12px] text-ink transition-all hover:text-vast active:scale-95 disabled:opacity-60"
              >
                <LogOut className="h-3.5 w-3.5" />
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 pb-24 lg:p-8 lg:pb-10">{children}</main>
      </div>
    </div>
  );
}
