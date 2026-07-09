'use client';

import Link from 'next/link';
import { Ban, Heart, Store, Utensils, X } from 'lucide-react';
import type { FoodPreferenceResponse } from '@repo/shared';

import { useFoodPreferences, useRemoveFoodPreference } from '@/hooks/use-food-preference';
import { showToast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api/errors';
import { Section } from '@/app/profile/_components/section';

function PreferenceRow({ pref }: { pref: FoodPreferenceResponse }) {
  const remove = useRemoveFoodPreference();
  const isRestaurant = pref.targetType === 'restaurant';
  const href = isRestaurant ? `/restaurants/${pref.targetId}` : `/restaurants/${pref.restaurantId}`;

  const onRemove = async () => {
    try {
      await remove.mutateAsync({ targetType: pref.targetType, targetId: pref.targetId });
    } catch (err) {
      showToast.error({ title: 'Could not remove', description: getErrorMessage(err) });
    }
  };

  return (
    <li className="flex items-center gap-3 rounded-xl border border-lumen-dk bg-lumen px-3 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-soft">
        {isRestaurant ? <Store className="h-3.5 w-3.5" /> : <Utensils className="h-3.5 w-3.5" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={href}
          className="truncate text-[13px] font-medium text-vast underline-offset-2 hover:text-fathom hover:underline"
        >
          {pref.name}
        </Link>
        <span className="truncate text-[11px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
          {isRestaurant ? 'restaurant' : (pref.restaurantName ?? 'dish')}
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={remove.isPending}
        aria-label={`Remove ${pref.name}`}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-lumen-dk bg-white text-soft transition-colors hover:border-pulse/50 hover:text-pulse disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" />
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
  tone: 'amber' | 'pulse';
}) {
  const toneClass = tone === 'amber' ? 'text-amber' : 'text-pulse';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className={`inline-flex items-center gap-1.5 ${toneClass}`}>
          <Icon className="h-3.5 w-3.5" />
          <span
            className="text-[10px] uppercase"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
          >
            {label}
          </span>
        </span>
        <span className="text-[11px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-[12px] text-soft">{hint}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((pref) => (
            <PreferenceRow key={pref.id} pref={pref} />
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
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <div className="h-10 w-full animate-pulse rounded-xl bg-lumen-dk" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-lumen-dk" />
        </div>
      ) : error ? (
        <p className="text-[13px] text-pulse">Could not load your preferences.</p>
      ) : favorites.length === 0 && blocked.length === 0 ? (
        <div className="rounded-xl border border-dashed border-lumen-dk bg-lumen p-4 text-[13px] text-ink">
          Use the <Heart className="mx-0.5 inline h-3.5 w-3.5 align-[-2px] text-amber" /> and{' '}
          <Ban className="mx-0.5 inline h-3.5 w-3.5 align-[-2px] text-pulse" /> buttons on a{' '}
          <Link
            href="/restaurants"
            className="text-fathom underline-offset-2 hover:underline"
            style={{ fontFamily: 'var(--font-mono)' }}
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
            tone="amber"
          />
          <Group icon={Ban} label="Blocked" hint="Nothing blocked." items={blocked} tone="pulse" />
        </div>
      )}
    </Section>
  );
}
