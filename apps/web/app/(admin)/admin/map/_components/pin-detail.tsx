'use client';

import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import type { AdminMapPin } from '@repo/shared';

import { FOCUS_RING } from '@/lib/focus-ring';
import { humanizeName } from '@/lib/humanize-name';
import { timeAgoLabel } from '@/lib/date';

/**
 * The selected pin, and the route to fixing it.
 *
 * This is what separates an instrument from a picture. Spotting a restaurant
 * with no menu items on a map is only useful if the next click edits it —
 * otherwise the operator has to memorise a name, leave for the restaurants
 * table, and search for it there.
 */
export function PinDetail({
  pin,
  staleBefore,
  onClose,
}: {
  pin: AdminMapPin;
  staleBefore: number;
  onClose: () => void;
}) {
  const isStale = new Date(pin.updatedAt).getTime() < staleBefore;

  const defects = [
    pin.isOutlier && {
      label: 'Coordinates are wrong',
      detail:
        'This sits far from every other restaurant, so nobody will ever be within delivery range of it.',
    },
    pin.menuItemCount === 0 && {
      label: 'No menu items',
      detail: 'The planner can suggest it, but there is nothing to order.',
    },
    isStale && {
      label: 'Not updated recently',
      detail: 'Prices shown to users may no longer match the source.',
    },
  ].filter((d): d is { label: string; detail: string } => Boolean(d));

  return (
    <div className="border-b border-sand bg-canvas px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight text-charcoal [overflow-wrap:anywhere]">
            {humanizeName(pin.name)}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-muted">
            {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Clear selection"
          className={`-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate transition-colors hover:bg-surface hover:text-charcoal ${FOCUS_RING}`}
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
        {[
          { term: 'Items', value: String(pin.menuItemCount) },
          { term: 'Rating', value: pin.rating != null ? pin.rating.toFixed(1) : '—' },
          { term: 'Source', value: pin.source === 'community' ? 'community' : 'scraped' },
        ].map(({ term, value }) => (
          <div key={term}>
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-muted">
              {term}
            </dt>
            <dd className="mt-0.5 font-mono tabular-nums text-charcoal">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-2.5 text-[11.5px] text-slate-muted">
        Updated {timeAgoLabel(pin.updatedAt) ?? 'never'}
      </p>

      {defects.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {defects.map((defect) => (
            <li
              key={defect.label}
              className="rounded-lg border border-tomato/30 bg-tomato/[0.06] px-2.5 py-2"
            >
              <p className="text-[12px] font-semibold text-tomato-ink">{defect.label}</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate">{defect.detail}</p>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/admin/restaurants/${pin.id}`}
        className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-sand bg-surface px-4 text-[13px] font-medium text-charcoal transition-colors hover:bg-canvas ${FOCUS_RING}`}
      >
        Open record
        <ArrowRight aria-hidden className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
