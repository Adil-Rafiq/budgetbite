'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, LogOut, Menu } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useAdminRecommendations } from '@/hooks/use-admin-recommendations';
import { useAdminIngestionHealth } from '@/hooks/use-admin-ingestion-health';
import { authClient } from '@/lib/auth-client';
import { LogoIcon } from '@/components/icons';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  ADMIN_NAV_GROUPS,
  adminSectionLabel,
  isAdminNavItemActive,
  type AdminNavItem,
} from '@/lib/admin-nav';
import { FOCUS_RING, FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';
import { initials } from '@/lib/name';

/**
 * A count worth interrupting the operator for, attached to a destination.
 *
 * `amber` is a queue with work in it; `tomato` is something broken. Both carry
 * a text label to the screen reader, because a coloured pill with a bare
 * numeral says nothing about why it is there.
 */
interface NavBadge {
  count: number;
  tone: 'amber' | 'tomato';
  /** Read after the number. "3 pending", "1 failed run". */
  srLabel: string;
}

function badgeClass(tone: NavBadge['tone']): string {
  return tone === 'tomato'
    ? 'border-tomato/40 bg-tomato/[0.08] text-tomato-ink'
    : 'border-amber/40 bg-amber-tint text-amber-ink';
}

function NavLink({
  item,
  active,
  badge,
  onNavigate,
}: {
  item: AdminNavItem;
  active: boolean;
  badge?: NavBadge;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${FOCUS_RING} ${
        active
          ? 'bg-teal-tint font-semibold text-teal-deep'
          : 'text-slate hover:bg-canvas hover:text-charcoal'
      }`}
    >
      {/* Active is a filled chip, not a hue swap — the teal tint behind it is
          1.16:1 and cannot carry "current page" on its own. */}
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          active ? 'bg-teal-deep text-white' : 'border border-sand bg-canvas text-slate'
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="text-sm">{item.label}</span>
      {badge && badge.count > 0 && (
        <span
          className={`ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border px-1.5 font-mono text-[11px] ${badgeClass(
            badge.tone,
          )}`}
        >
          {badge.count}
          <span className="sr-only"> {badge.srLabel}</span>
        </span>
      )}
    </Link>
  );
}

function NavGroups({
  pathname,
  badges,
  onNavigate,
}: {
  pathname: string;
  badges: Record<string, NavBadge | undefined>;
  onNavigate?: () => void;
}) {
  return (
    <>
      {ADMIN_NAV_GROUPS.map((group, i) => (
        <div key={group.label ?? 'lead'} className={i === 0 ? '' : 'mt-5'}>
          {group.label && (
            <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-muted">
              {group.label}
            </p>
          )}
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isAdminNavItemActive(pathname, item.href)}
                badge={badges[item.href]}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function Wordmark({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/admin" onClick={onNavigate} className={`flex items-center gap-2.5 ${FOCUS_RING}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-deep text-white shadow-sm">
        <LogoIcon size={16} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-tight text-charcoal">
          Budget<span className="text-teal-deep">Bite</span>
        </span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-muted">
          admin
        </span>
      </span>
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useUser();
  const { data: pendingRecs } = useAdminRecommendations({ status: 'pending', limit: 1 });
  const { data: ingestion } = useAdminIngestionHealth();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // The drawer is navigation, and navigation that survives its own destination
  // traps the operator behind the thing they just used.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const badges: Record<string, NavBadge | undefined> = {
    '/admin/recommendations': {
      count: pendingRecs?.meta.total ?? 0,
      tone: 'amber',
      srLabel: 'pending',
    },
    '/admin/ingestion': ingestion?.isBroken
      ? {
          count: ingestion.consecutiveFailures,
          tone: 'tomato',
          srLabel: ingestion.consecutiveFailures === 1 ? 'failed run' : 'consecutive failed runs',
        }
      : undefined,
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.push('/login');
    } finally {
      setSigningOut(false);
    }
  };

  const userCard = (
    <div className="flex items-center gap-3 rounded-2xl border border-sand bg-canvas px-3 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-deep text-sm font-semibold text-white">
        {initials(user?.name)}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-display text-[13px] font-semibold text-charcoal">
          {user?.name ?? '—'}
        </span>
        <span className="truncate text-[11px] text-slate-muted">{user?.email ?? ''}</span>
      </div>
    </div>
  );

  const backToApp = (
    <Link
      href="/dashboard"
      className={`flex min-h-11 items-center gap-2 rounded-xl border border-sand bg-white px-3 py-2 text-[13px] text-slate transition-colors hover:bg-canvas hover:text-charcoal ${FOCUS_RING}`}
    >
      <ArrowLeft aria-hidden className="h-4 w-4" />
      Back to app
    </Link>
  );

  return (
    <div className="min-h-screen bg-canvas text-charcoal antialiased">
      <a
        href="#admin-content"
        className={`sr-only z-50 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-xl focus:bg-teal-deep focus:px-4 focus:text-sm focus:font-semibold focus:text-white ${FOCUS_RING}`}
      >
        Skip to content
      </a>

      {/* Desktop rail */}
      <aside
        aria-label="Admin sidebar"
        className="fixed inset-y-0 left-0 z-30 hidden border-r border-sand bg-white text-charcoal lg:flex lg:w-64 lg:flex-col"
      >
        <div className="border-b border-sand px-6 py-5">
          <Wordmark />
        </div>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
          <NavGroups pathname={pathname} badges={badges} />
        </nav>
        <div className="mt-auto flex flex-col gap-3 px-4 pb-4 pt-2">
          {backToApp}
          {userCard}
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header
          className="sticky top-0 z-40 border-b border-sand bg-canvas/85"
          style={{ backdropFilter: 'saturate(180%) blur(10px)' }}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-8 lg:py-4">
            <div className="flex min-w-0 items-center gap-2">
              {/* Below lg the rail is hidden, and this drawer is the whole of
                  admin navigation. Without it every destination but the one
                  you landed on required typing a URL. */}
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open admin menu"
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-sand bg-white text-slate transition-colors hover:text-charcoal lg:hidden ${FOCUS_RING_ON_CANVAS}`}
                  >
                    <Menu aria-hidden className="h-4 w-4" />
                  </button>
                </SheetTrigger>
                {/* gap-0 because SheetContent's default gap-4 would space the
                    header, nav and footer apart from the borders that already
                    separate them. */}
                <SheetContent side="left" className="w-[17rem] gap-0 bg-white p-0">
                  <SheetTitle className="sr-only">Admin navigation</SheetTitle>
                  <div className="border-b border-sand px-5 py-4">
                    <Wordmark onNavigate={() => setMenuOpen(false)} />
                  </div>
                  <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
                    <NavGroups
                      pathname={pathname}
                      badges={badges}
                      onNavigate={() => setMenuOpen(false)}
                    />
                  </nav>
                  <div className="mt-auto flex flex-col gap-3 border-t border-sand px-4 py-4">
                    {backToApp}
                    {userCard}
                  </div>
                </SheetContent>
              </Sheet>

              {/* The header used to read "admin" on every one of eleven routes,
                  duplicating the rail's own monogram. It now says where you
                  are, which is the one thing it was not saying. */}
              <span className="truncate font-mono text-[11px] uppercase tracking-[0.22em] text-slate-muted">
                {adminSectionLabel(pathname)}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/dashboard"
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[12px] text-slate transition-colors hover:text-charcoal lg:hidden ${FOCUS_RING_ON_CANVAS}`}
              >
                <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
                App
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border border-sand bg-white px-3 text-[12px] text-slate transition-all hover:text-charcoal active:scale-95 disabled:opacity-60 ${FOCUS_RING_ON_CANVAS}`}
              >
                <LogOut aria-hidden className="h-3.5 w-3.5" />
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </header>
        <main id="admin-content" tabIndex={-1} className="flex-1 p-4 pb-24 lg:p-8 lg:pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
