'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import { BadgeCheck, LogOut, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

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
import { FadeUp } from '@/components/motion';
import { DietaryCard } from '@/app/(app)/profile/_components/dietary-card';
import { FoodPreferencesCard } from '@/app/(app)/profile/_components/food-preferences-card';
import { LocationCard } from '@/app/(app)/profile/_components/location-card';
import { NotificationTimesCard } from '@/app/(app)/profile/_components/notification-times-card';
import { PasswordCard } from '@/app/(app)/profile/_components/password-card';
import { PersonalCard } from '@/app/(app)/profile/_components/personal-card';
import { useSignOut } from '@/hooks/use-sign-out';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useUser } from '@/hooks/use-user';
import { FOCUS_RING, FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';
import { initials } from '@/lib/name';

type DirtyKey = 'personal' | 'location' | 'dietary' | 'reminders' | 'password';

/**
 * A band of the page.
 *
 * This used to be a bare heading dropped into the same flat grid as the cards,
 * which meant nothing was actually grouped — three captions were interleaved
 * into one card list, and because the card counts didn't divide by two the
 * "bands" showed up as whitespace holes. It is a real container now, and it
 * carries the region landmark that the cards used to hoard.
 */
function Band({
  label,
  note,
  columns = 2,
  children,
}: {
  label: string;
  note: string;
  columns?: 1 | 2;
  children: React.ReactNode;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2
          id={headingId}
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-ink"
        >
          {label}
        </h2>
        <p className="text-[13px] text-slate">{note}</p>
      </div>
      <div
        className={`grid grid-cols-1 items-stretch gap-5 ${columns === 2 ? 'lg:grid-cols-2' : ''}`}
      >
        {children}
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const { signOut, signingOut } = useSignOut();
  const { data: user, isPending } = useUser();
  const [avatarBroken, setAvatarBroken] = useState(false);

  const [dirty, setDirty] = useState<Record<DirtyKey, boolean>>({
    personal: false,
    location: false,
    dietary: false,
    reminders: false,
    password: false,
  });

  // One stable callback per card: an inline arrow would be a new function on
  // every render, and each card reports its dirty state from an effect.
  const mark = useCallback(
    (key: DirtyKey) => (value: boolean) =>
      setDirty((prev) => (prev[key] === value ? prev : { ...prev, [key]: value })),
    [],
  );
  const onPersonalDirty = useMemo(() => mark('personal'), [mark]);
  const onLocationDirty = useMemo(() => mark('location'), [mark]);
  const onDietaryDirty = useMemo(() => mark('dietary'), [mark]);
  const onRemindersDirty = useMemo(() => mark('reminders'), [mark]);
  const onPasswordDirty = useMemo(() => mark('password'), [mark]);

  const dirtyCount = Object.values(dirty).filter(Boolean).length;
  const hasUnsaved = dirtyCount > 0;

  const { pendingHref, confirmLeave, cancelLeave, runGuarded } = useUnsavedChanges(hasUnsaved);

  if (isPending || !user) {
    return (
      <div aria-busy="true" className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
        <span className="sr-only" role="status">
          Loading your profile
        </span>
        <div className="flex flex-col gap-2">
          <div className="h-3 w-32 animate-pulse rounded bg-sand" />
          <div className="h-9 w-56 animate-pulse rounded bg-sand" />
          <div className="h-4 w-72 animate-pulse rounded bg-sand" />
        </div>
        <div className="h-24 w-full animate-pulse rounded-2xl bg-sand" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="h-64 w-full animate-pulse rounded-2xl bg-sand" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-sand" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-sand" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-sand" />
        </div>
      </div>
    );
  }

  const showAvatar = !!user.image && !avatarBroken;

  return (
    <FadeUp className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-teal-ink">
          Account · Profile
        </div>
        <h1 className="font-display text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.05] tracking-tight text-charcoal">
          The rules you plan by.
        </h1>
        <p className="text-[14px] text-slate">
          Where you order from and what you won&apos;t eat decide what the planner can suggest.
          Everything else here is just your account.
        </p>
      </header>

      {/* Identity */}
      <section
        aria-label="Account summary"
        className="rounded-2xl border border-sand bg-surface p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-4">
          {showAvatar ? (
            // A revoked OAuth account or a privacy extension turns this into a
            // broken-image glyph, and `alt=""` guarantees no text stands in for
            // it — so fall back to the initials the other branch already renders.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image ?? ''}
              alt=""
              onError={() => setAvatarBroken(true)}
              className="h-14 w-14 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-deep font-display text-[18px] font-semibold text-white"
            >
              {initials(user.name)}
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate font-display text-[18px] font-semibold tracking-tight text-charcoal">
              {user.name || '—'}
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate">
              <span className="truncate">{user.email}</span>
              {user.emailVerified && (
                <span className="inline-flex items-center gap-1 text-teal-ink">
                  <BadgeCheck aria-hidden className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium">Verified</span>
                </span>
              )}
              {user.role === 'admin' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-teal/30 bg-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-ink">
                  <ShieldCheck aria-hidden className="h-3 w-3" />
                  Admin
                </span>
              )}
              {user.createdAt && (
                <span className="text-[11px] text-slate">
                  Member since {format(new Date(user.createdAt), 'MMM yyyy')}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => runGuarded(() => void signOut())}
            disabled={signingOut}
            aria-busy={signingOut}
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-sand bg-surface px-4 text-[13px] font-medium text-slate transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
          >
            <LogOut aria-hidden className="h-3.5 w-3.5" />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </section>

      {/* Location leads its band at full width: it owns a map and an address
          search, and it is the one setting here that can change every future
          suggestion. The old uniform two-column grid said it cost the same as
          a last name. */}
      <Band
        label="What the planner uses"
        note="Change any of these and tomorrow's suggestions change with them."
      >
        <div className="lg:col-span-2">
          <LocationCard onDirtyChange={onLocationDirty} />
        </div>
        <DietaryCard onDirtyChange={onDietaryDirty} />
        <FoodPreferencesCard />
      </Band>

      <Band
        label="Your budget plan"
        note="Settings that belong to the plan you're running now, not to your account."
        columns={1}
      >
        <NotificationTimesCard onDirtyChange={onRemindersDirty} />
      </Band>

      <Band label="Account" note="Who you are and how you sign in.">
        <PersonalCard onDirtyChange={onPersonalDirty} />
        <PasswordCard onDirtyChange={onPasswordDirty} />
      </Band>

      {/* Leaving with unsaved work — covers in-app links, browser Back, and
          sign-out, all routed through the same hook. */}
      <AlertDialog open={!!pendingHref} onOpenChange={(open) => !open && cancelLeave()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="text-xs font-semibold uppercase tracking-widest text-amber-ink">
              Confirm · Unsaved
            </div>
            <AlertDialogTitle className="font-display text-xl font-semibold tracking-tight text-charcoal">
              {/* Guard the zero: a save can resolve while this dialog is open. */}
              {dirtyCount <= 1
                ? 'Leave with an unsaved change?'
                : `Leave with ${dirtyCount} unsaved changes?`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate">
              The cards marked <span className="font-semibold text-amber-ink">Unsaved</span>{' '}
              haven&apos;t been written yet. Leave now and those edits are gone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={`min-h-11 rounded-xl border border-sand bg-surface px-4 text-[13px] font-medium text-slate transition-colors hover:bg-canvas active:scale-[0.97] ${FOCUS_RING_ON_CANVAS}`}
            >
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeave}
              className={`min-h-11 rounded-xl bg-tomato-deep px-5 text-[13px] font-semibold text-white transition-colors hover:bg-tomato-deep/90 active:scale-[0.97] ${FOCUS_RING_ON_CANVAS}`}
            >
              Discard and leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FadeUp>
  );
}
