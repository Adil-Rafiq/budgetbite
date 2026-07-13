'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Database,
  Gauge,
  LayoutGrid,
  LogOut,
  ScrollText,
  Settings2,
  Sparkles,
  Store,
  UsersRound,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useAdminRecommendations } from '@/hooks/use-admin-recommendations';
import { authClient } from '@/lib/auth-client';
import { LogoIcon } from '@/components/icons';

// Admin nav. Add an item here when a new admin resource page lands.
const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/restaurants', label: 'Restaurants', icon: Store },
  { href: '/admin/meal-types', label: 'Meal types', icon: UtensilsCrossed },
  { href: '/admin/recommendations', label: 'Recommendations', icon: Sparkles },
  { href: '/admin/users', label: 'Users', icon: UsersRound },
  { href: '/admin/plans', label: 'Plans', icon: ClipboardList },
  { href: '/admin/ingestion', label: 'Ingestion', icon: Database },
  { href: '/admin/data-quality', label: 'Data quality', icon: Gauge },
  { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
  { href: '/admin/config', label: 'Config', icon: Settings2 },
];

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

function initials(name: string | undefined): string {
  if (!name) return '•';
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.charAt(0).toUpperCase() ?? '';
  const b = parts[1]?.charAt(0).toUpperCase() ?? '';
  return `${a}${b}` || '•';
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useUser();
  const { data: pendingRecs } = useAdminRecommendations({ status: 'pending', limit: 1 });
  const pendingCount = pendingRecs?.meta.total ?? 0;
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
    <div className="min-h-screen bg-canvas text-charcoal antialiased">
      <aside className="fixed inset-y-0 hidden border-r border-sage bg-white text-charcoal lg:flex lg:w-64 lg:flex-col">
        {/* Logo */}
        <Link href="/admin" className="flex items-center gap-2.5 border-b border-sage px-6 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green text-white shadow-sm">
            <LogoIcon size={16} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight text-charcoal">
              Budget<span className="text-green">Bite</span>
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-slate/60">
              admin
            </span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-slate/60">
            manage
          </p>
          {navItems.map((item) => {
            const active = isItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  active
                    ? 'bg-[#f0f9e0] text-dark-green'
                    : 'text-slate hover:bg-canvas hover:text-charcoal'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    active ? 'bg-green/15 text-green' : 'border border-sage bg-canvas text-slate'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-medium">{item.label}</span>
                {item.href === '/admin/recommendations' && pendingCount > 0 && (
                  <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-[#f5a623]/30 bg-[#f5a623]/15 px-1.5 font-mono text-[11px] text-[#9a6400]">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer — back to app + user */}
        <div className="mt-auto flex flex-col gap-3 px-4 pb-4 pt-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-sage bg-white px-3 py-2 text-[13px] text-slate transition-colors hover:bg-canvas hover:text-charcoal"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Link>
          <div className="flex items-center gap-3 rounded-2xl border border-sage bg-canvas px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green text-sm font-semibold text-white">
              {initials(user?.name)}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-display text-[13px] font-semibold text-charcoal">
                {user?.name ?? '—'}
              </span>
              <span className="truncate text-[11px] text-slate">{user?.email ?? ''}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header
          className="sticky top-0 z-40 border-b border-sage bg-canvas/85"
          style={{ backdropFilter: 'saturate(180%) blur(10px)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 lg:px-8 lg:py-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate/60">
              admin
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-[12px] text-slate transition-colors hover:text-charcoal lg:hidden"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                App
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center gap-1.5 rounded-full border border-sage bg-white px-3 py-1.5 text-[12px] text-slate transition-all hover:text-charcoal active:scale-95 disabled:opacity-60"
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
