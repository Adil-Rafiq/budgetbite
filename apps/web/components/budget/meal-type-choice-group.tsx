'use client';

import { Check } from 'lucide-react';
import { FOCUS_RING } from '@/lib/focus-ring';
import { MAX_MEALS_PER_DAY, type BudgetPlanMealTypeOption } from '@/lib/budget-plan/schema';

/**
 * Which meals a plan covers — the single most consequential setting in either
 * budget wizard, and until now the least reachable one.
 *
 * The /plans dialog rendered these as a `<label>` wrapping a Radix `Checkbox`
 * with `className="hidden"`. Tailwind `hidden` is `display: none`, which drops
 * the control out of the tab order *and* the accessibility tree — so a keyboard
 * or screen-reader user could open the wizard, reach the budget field, and
 * never learn a choice existed. They were silently committed to whatever the
 * first option happened to be. A real `role="checkbox"` button fixes both the
 * focus path and the announcement, and the visible check means the state is not
 * carried by fill colour alone.
 *
 * `grid` is the full-page treatment (onboarding); `inline` is the compact pill
 * row that fits the create-plan dialog. Both keep a 44px minimum target.
 */
export function MealTypeChoiceGroup({
  options,
  selectedIds,
  onToggle,
  atLimit = false,
  variant = 'grid',
  label,
}: {
  options: BudgetPlanMealTypeOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  atLimit?: boolean;
  variant?: 'grid' | 'inline';
  /** Accessible name for the group, e.g. "Which meals do you eat out?". */
  label: string;
}) {
  const isInline = variant === 'inline';

  return (
    <>
      <div
        role="group"
        aria-label={label}
        className={
          isInline ? 'flex flex-wrap gap-2' : 'grid grid-cols-2 gap-2 sm:grid-cols-3'
        }
      >
        {options.map((type) => {
          const checked = selectedIds.includes(type.id);
          const blocked = !checked && atLimit;

          return (
            <button
              key={type.id}
              type="button"
              role="checkbox"
              aria-checked={checked}
              disabled={blocked}
              onClick={() => onToggle(type.id)}
              className={
                isInline
                  ? `inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-3.5 text-[13px] capitalize transition-all ${FOCUS_RING} ${
                      checked
                        ? 'border-dark-green bg-green/10 font-semibold text-charcoal'
                        : blocked
                          ? 'cursor-not-allowed border-sage bg-white font-medium text-slate/40'
                          : 'border-sage bg-white font-medium text-slate hover:border-dark-green/50'
                    }`
                  : `flex min-h-11 items-center gap-2.5 rounded-xl border-2 px-3.5 py-3 text-left text-sm capitalize transition-all ${FOCUS_RING} ${
                      checked
                        ? 'border-dark-green bg-green/10 font-semibold text-charcoal'
                        : blocked
                          ? 'cursor-not-allowed border-sage bg-white font-medium text-slate/40'
                          : 'border-sage bg-white font-medium text-slate hover:border-dark-green/50'
                    }`
              }
            >
              <span
                aria-hidden
                className={`flex shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isInline ? 'h-4 w-4' : 'h-5 w-5'
                } ${checked ? 'border-dark-green bg-dark-green text-white' : 'border-sage bg-white'}`}
              >
                {checked && <Check className={isInline ? 'h-2.5 w-2.5' : 'h-3 w-3'} />}
              </span>
              {type.label}
            </button>
          );
        })}
      </div>

      {atLimit && (
        <p className={`text-slate ${isInline ? 'mt-2 text-[11px]' : 'mt-3 text-xs'}`}>
          That&apos;s the maximum of {MAX_MEALS_PER_DAY} meals a day. Deselect one to swap.
        </p>
      )}
    </>
  );
}
