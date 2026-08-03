'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { LogoIcon } from '@/components/icons';
import { BudgetReadout } from '@/components/budget-readout';
import { ThemeToggle } from '@/components/theme-toggle';
import { authClient } from '@/lib/auth-client';
import { FOCUS_RING, FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';
import { initials } from '@/lib/name';
import { ADMIN_NAV_ITEM, canSeeAdmin, sectionLabel } from '@/lib/nav';
import { useHasUnsavedChanges } from '@/hooks/use-unsaved-changes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * The desktop breadcrumb used to be the literal string "Home · Dashboard" on
 * every route, so `/plans/[id]` announced "Dashboard" directly above a page
 * headed "Budget plans". A breadcrumb that cannot be wrong is one derived from
 * where you actually are.
 *
 * The labels now come from `lib/nav`, which is also what the rail and the tab
 * bar render. This header kept its own map and called `/plans` "Budget plans"
 * while the rail called it "Plans" — one destination answering to two names
 * depending on which half of the shell you read.
 */
function breadcrumbFor(pathname: string): string {
  const [section, second] = pathname.split('/').filter(Boolean);
  if (!section) return 'Home';

  const label = sectionLabel(section) ?? section.charAt(0).toUpperCase() + section.slice(1);
  // A nested id segment means "inside" that section, not a new one.
  const isDetail = !!second && !sectionLabel(second);
  return isDetail ? `Home · ${label} · Detail` : `Home · ${label}`;
}

export function AppHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const { data: user } = useUser();
  const [signingOut, setSigningOut] = useState(false);
  // This Sign out is a menu item, not an anchor, so the profile page's
  // click-interceptor guard could never see it — one tap here discarded every
  // unsaved edit on that page, forty pixels from a Sign out that confirmed.
  const hasUnsavedChanges = useHasUnsavedChanges();
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      // Without this the query cache outlives the session, so the next account
      // to sign in on this browser sees the previous one's data on first paint.
      queryClient.clear();
      router.push('/login');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-40 border-b border-sand bg-canvas/85"
      style={{ backdropFilter: 'saturate(180%) blur(10px)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 lg:px-8 lg:py-4">
        {/* Mobile logo */}
        <Link
          href="/dashboard"
          aria-label="BudgetBite — go to dashboard"
          className={`flex shrink-0 items-center gap-2.5 rounded-lg lg:hidden ${FOCUS_RING_ON_CANVAS}`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-deep text-white">
            <LogoIcon size={13} />
          </span>
          {/* The wordmark yields to the budget figure on a phone. The mark still
              identifies the app and the tab bar names where you are; the money
              is the thing this header exists to keep in front of the user. */}
          <span className="hidden font-display text-base font-bold tracking-tight sm:inline">
            Budget<span className="text-teal-ink">Bite</span>
          </span>
        </Link>

        <div className="hidden text-xs font-semibold uppercase tracking-widest text-slate lg:block">
          {breadcrumbFor(pathname)}
        </div>

        <div className="flex items-center gap-3">
          {/* Budget pill: only where the rail's persistent readout is not
              visible (below lg). On desktop the rail already shows this, so the
              pill would be a third copy of the same number. Both render from
              <BudgetReadout>, so they cannot drift apart again. */}
          <div className="lg:hidden">
            <BudgetReadout variant="pill" />
          </div>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                // Stays 44px at every width. It used to shrink to 36 above the
                // `sm` breakpoint, which is under the 44px target floor — on
                // the only path to sign out, Profile, and Admin.
                className={`inline-flex size-11 items-center justify-center rounded-full bg-teal-deep text-xs font-semibold text-white transition-all hover:bg-teal-deeper active:scale-95 ${FOCUS_RING_ON_CANVAS}`}
                aria-label={user?.name ? `Account menu for ${user.name}` : 'Account menu'}
              >
                {initials(user?.name)}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="min-w-[220px]">
              {user && (
                <>
                  <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
                    <span className="truncate text-[13px] font-medium text-charcoal">
                      {user.name || '—'}
                    </span>
                    <span className="truncate text-[11px] text-slate">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserIcon className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              {/* Admin lives here rather than in the rail: the rail's twin, the
                  phone tab bar, has no room for a sixth slot, and an entry that
                  exists on one device and not the other is exactly how admins
                  ended up unable to reach /admin below lg. */}
              {canSeeAdmin(user?.role) && (
                <DropdownMenuItem asChild>
                  <Link href={ADMIN_NAV_ITEM.href}>
                    <ADMIN_NAV_ITEM.icon className="h-4 w-4" />
                    {ADMIN_NAV_ITEM.label}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  if (hasUnsavedChanges) setConfirmSignOutOpen(true);
                  else handleSignOut();
                }}
                disabled={signingOut}
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? 'Signing out…' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={confirmSignOutOpen} onOpenChange={setConfirmSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="text-xs font-semibold uppercase tracking-widest text-amber-ink">
              Confirm · Sign out
            </div>
            <AlertDialogTitle className="font-display text-xl font-semibold tracking-tight text-charcoal">
              Sign out with unsaved changes?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate">
              You have edits on this page that haven&apos;t been saved. Signing out now loses them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={`min-h-11 rounded-xl border border-sand bg-surface px-4 text-[13px] font-medium text-slate transition-colors hover:bg-canvas active:scale-[0.97] ${FOCUS_RING}`}
            >
              Go back and save
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              className={`min-h-11 rounded-xl bg-tomato-deep px-5 text-[13px] font-semibold text-white transition-colors hover:bg-tomato-deep/90 active:scale-[0.97] ${FOCUS_RING}`}
            >
              Sign out anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
