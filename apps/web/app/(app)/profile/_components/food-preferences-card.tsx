'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Ban, Heart, Store, Utensils, X } from 'lucide-react';
import type { FoodPreferenceResponse } from '@repo/shared';

import { useFoodPreferences, useRemoveFoodPreference } from '@/hooks/use-food-preference';
import { showToast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api/errors';
import { FOCUS_RING } from '@/lib/focus-ring';
import { Section } from '@/app/(app)/profile/_components/section';

function PreferenceRow({
  pref,
  onRemoved,
}: {
  pref: FoodPreferenceResponse;
  onRemoved: () => void;
}) {
  const remove = useRemoveFoodPreference();
  const isRestaurant = pref.targetType === 'restaurant';
  const href = isRestaurant ? `/restaurants/${pref.targetId}` : `/restaurants/${pref.restaurantId}`;

  const onRemove = async () => {
    try {
      await remove.mutateAsync({ targetType: pref.targetType, targetId: pref.targetId });
      // The row — and the button holding focus — unmounts on success, which
      // dropped the caret to `<body>` and teleported a keyboard user to the top
      // of a very long page with no announcement. Hand focus back deliberately.
      onRemoved();
      showToast.success({ title: `Removed ${pref.name}` });
    } catch (err) {
      showToast.error({ title: 'Could not remove', description: getErrorMessage(err) });
    }
  };

  return (
    <li className="flex items-center gap-3 rounded-xl border border-sand bg-canvas py-1.5 pl-3 pr-1.5">
      <span
        aria-hidden
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate"
      >
        {isRestaurant ? <Store className="h-3.5 w-3.5" /> : <Utensils className="h-3.5 w-3.5" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={href}
          className={`truncate rounded text-[13px] font-medium text-charcoal underline-offset-2 hover:text-teal-deep hover:underline ${FOCUS_RING}`}
        >
          {pref.name}
        </Link>
        <span className="truncate text-[11px] text-slate">
          {isRestaurant ? 'Restaurant' : (pref.restaurantName ?? 'Dish')}
        </span>
      </div>
      {/* 44px hit area around a 14px glyph. This was `h-6 w-6` — a 24px
          destructive control, the smallest target on the page. */}
      <button
        type="button"
        data-remove-pref
        onClick={onRemove}
        disabled={remove.isPending}
        aria-label={`Remove ${pref.name}`}
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate transition-colors hover:bg-white hover:text-tomato-ink disabled:opacity-50 ${FOCUS_RING}`}
      >
        <X aria-hidden className="h-4 w-4" />
      </button>
    </li>
  );
}

function Group({
  icon: Icon,
  label,
  hint,
  items,
  tone,
}: {
  icon: typeof Heart;
  label: string;
  hint: string;
  items: FoodPreferenceResponse[];
  tone: 'positive' | 'danger';
}) {
  const toneClass = tone === 'positive' ? 'text-teal-deep' : 'text-tomato-ink';
  const listRef = useRef<HTMLUListElement>(null);
  const headingRef = useRef<HTMLSpanElement>(null);

  /** Focus the nearest surviving remove button, or the group label if none. */
  const focusAfterRemoval = (idx: number) =>
    requestAnimationFrame(() => {
      const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-remove-pref]');
      if (buttons?.length) {
        (buttons[Math.min(idx, buttons.length - 1)] ?? buttons[buttons.length - 1])?.focus();
      } else {
        headingRef.current?.focus();
      }
    });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span
          ref={headingRef}
          tabIndex={-1}
          className={`inline-flex items-center gap-1.5 ${toneClass}`}
        >
          <Icon aria-hidden className="h-3.5 w-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">{label}</span>
        </span>
        <span className="text-[11px] text-slate">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-[12px] text-slate">{hint}</p>
      ) : (
        <ul ref={listRef} className="flex flex-col gap-2">
          {items.map((pref, i) => (
            <PreferenceRow key={pref.id} pref={pref} onRemoved={() => focusAfterRemoval(i)} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function FoodPreferencesCard() {
  const { data, isLoading, error } = useFoodPreferences();

  const favorites = (data ?? []).filter((p) => p.sentiment === 'favorite');
  const blocked = (data ?? []).filter((p) => p.sentiment === 'blocked');

  return (
    <Section
      icon={Heart}
      title="Favorites & blocks"
      hint="Favorites nudge the AI toward these; blocks are never suggested."
      tone="planner"
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <div className="h-10 w-full animate-pulse rounded-xl bg-sand" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-sand" />
        </div>
      ) : error ? (
        <p className="text-[13px] text-tomato-ink">Could not load your preferences.</p>
      ) : favorites.length === 0 && blocked.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sand bg-canvas p-4 text-[13px] text-slate">
          Use the{' '}
          <Heart aria-hidden className="mx-0.5 inline h-3.5 w-3.5 align-[-2px] text-teal-deep" />{' '}
          and <Ban aria-hidden className="mx-0.5 inline h-3.5 w-3.5 align-[-2px] text-tomato-ink" />{' '}
          buttons on a{' '}
          <Link
            href="/restaurants"
            className={`rounded text-teal-deep underline-offset-2 hover:underline ${FOCUS_RING}`}
          >
            restaurant or dish
          </Link>{' '}
          to build these lists.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <Group
            icon={Heart}
            label="Favorites"
            hint="No favorites yet."
            items={favorites}
            tone="positive"
          />
          <Group icon={Ban} label="Blocked" hint="Nothing blocked." items={blocked} tone="danger" />
        </div>
      )}
    </Section>
  );
}
