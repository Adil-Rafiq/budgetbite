import type { ReactNode } from 'react';

/**
 * The small "label above value" tile used across plan cards, the create-plan
 * preview, and both summary cards.
 *
 * Four components had copy-pasted their own definition of this one visual idea,
 * which is why only some of them ever picked up `tabular-nums` — money in a
 * 3-across grid needs aligned digits, or the columns visibly jitter between
 * cards. One definition, so the next improvement lands everywhere.
 */
export function StatTile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  /** A string, or a composed value such as `<RemainingAmount />`. */
  value: ReactNode;
  tone?: 'default' | 'alarm';
}) {
  return (
    <div className="rounded-lg border border-sand bg-canvas px-2 py-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate/60">{label}</p>
      <div
        className={`font-display text-sm font-semibold tabular-nums ${
          tone === 'alarm' ? 'text-tomato-ink' : 'text-charcoal'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
