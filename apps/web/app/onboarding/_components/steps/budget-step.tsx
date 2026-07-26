'use client';

import { CalendarDays, CalendarRange, Check, RefreshCw } from 'lucide-react';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { MAX_MEALS_PER_DAY } from '@/app/onboarding/constants';
import { formatPKR } from '@/lib/currency';
import { FOCUS_RING } from '@/lib/focus-ring';

const cardClass = 'rounded-[20px] border border-sage bg-white p-5 shadow-sm sm:p-6';

export const BudgetStep = () => {
  const { steps, mealTypes } = useOnboardingContext();
  const {
    values,
    actions,
    errors,
    mealTypeOptions,
    breakdown,
    presets,
    atMealTypeLimit,
    lastConversion,
  } = steps.budget;

  // Empty field reads as NaN, not 0 — so clearing it says "enter an amount"
  // instead of painting a "must be positive" error over a literal 0 the user
  // then has to delete.
  const budgetText = Number.isFinite(values.totalBudget) ? String(values.totalBudget) : '';

  const selectedMealTypes = mealTypeOptions.filter((type) =>
    values.selectedMealTypeIds.includes(type.id),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* ── Plan type segmented toggle ── */}
      <div
        role="group"
        aria-label="Budget period"
        className="flex gap-1 rounded-[18px] border border-sage bg-white p-2 shadow-sm"
      >
        {(
          [
            { type: 'weekly', label: 'Weekly', icon: CalendarRange },
            { type: 'monthly', label: 'Monthly', icon: CalendarDays },
          ] as const
        ).map(({ type, label, icon: Icon }) => {
          const active = values.planType === type;
          return (
            <button
              key={type}
              type="button"
              aria-pressed={active}
              onClick={() => actions.setPlanType(type)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${FOCUS_RING} ${
                active
                  ? 'bg-green-deep text-white shadow-md shadow-dark-green/25'
                  : 'bg-transparent text-slate hover:text-charcoal'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Budget amount ── */}
      <div className={cardClass}>
        <label
          htmlFor="budget"
          className="text-xs font-semibold uppercase tracking-wide text-slate"
        >
          Total food budget
        </label>
        <div className="mt-4 mb-5 flex items-end gap-3">
          <span aria-hidden className="pb-1 font-display text-2xl font-bold text-dark-green">
            ₨
          </span>
          <input
            id="budget"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={budgetText}
            placeholder="0"
            onChange={(event) => {
              const digits = event.target.value.replace(/[^\d]/g, '');
              actions.setTotalBudget(digits === '' ? Number.NaN : Number(digits));
            }}
            aria-describedby="budget-period"
            aria-invalid={errors.totalBudget ? true : undefined}
            className={`min-w-0 flex-1 border-b-2 border-sage bg-transparent pb-1 font-display text-4xl font-bold text-charcoal transition-colors placeholder:text-slate/30 focus:border-dark-green sm:text-5xl ${FOCUS_RING}`}
          />
          <span id="budget-period" className="pb-2 text-sm text-slate">
            / {values.planType === 'weekly' ? 'week' : 'month'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 self-center text-xs text-slate">Quick pick:</span>
          {presets.map((preset) => {
            const active = values.totalBudget === preset;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={active}
                onClick={() => actions.setTotalBudget(preset)}
                className={`min-h-11 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${FOCUS_RING} ${
                  active
                    ? 'border-dark-green bg-green/10 font-semibold text-dark-green'
                    : 'border-sage text-slate hover:border-dark-green hover:text-dark-green'
                }`}
              >
                {formatPKR(preset)}
              </button>
            );
          })}
        </div>

        {lastConversion && !errors.totalBudget && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-sage bg-canvas px-3 py-2 text-xs text-slate">
            <RefreshCw aria-hidden className="mt-0.5 h-3 w-3 shrink-0 text-dark-green" />
            <span>
              Converted {formatPKR(lastConversion.from)} to{' '}
              <span className="font-semibold text-charcoal">{formatPKR(lastConversion.to)}</span> so
              it means the same spend per day. Edit it if that is not what you wanted.
            </span>
          </p>
        )}

        {errors.totalBudget && (
          <p role="alert" className="mt-3 text-xs font-medium text-tomato">
            {errors.totalBudget}
          </p>
        )}
      </div>

      {/* ── Meal types ── */}
      <div className={cardClass}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate">
          Which meals do you eat out?
        </h2>

        {mealTypes.status === 'loading' && (
          <div className="flex flex-wrap gap-2" aria-busy="true" aria-label="Loading meal types">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[42px] w-28 animate-pulse rounded-xl border border-sage bg-canvas"
              />
            ))}
          </div>
        )}

        {mealTypes.status === 'error' && (
          <div
            role="alert"
            className="flex flex-col items-start gap-2 rounded-xl border border-tomato/30 bg-tomato/5 p-4 text-sm"
          >
            <div className="font-semibold text-tomato">Couldn&apos;t load meal types</div>
            <div className="text-xs text-slate">
              This is usually a dropped connection. Your budget is saved on this device, so nothing
              is lost if you retry.
            </div>
            <button
              type="button"
              onClick={mealTypes.refetch}
              className={`min-h-11 rounded-lg border border-sage bg-white px-3 py-2 text-xs font-semibold text-dark-green transition-colors hover:border-dark-green ${FOCUS_RING}`}
            >
              Try again
            </button>
          </div>
        )}

        {mealTypes.status === 'empty' && (
          <div className="rounded-xl border border-sage bg-canvas p-4 text-sm">
            <div className="font-semibold text-charcoal">No meal types available yet</div>
            <div className="mt-0.5 text-xs leading-relaxed text-slate">
              Meal types are configured by an admin, and none exist yet. Setup can&apos;t finish
              until at least one is added.
            </div>
            <button
              type="button"
              onClick={mealTypes.refetch}
              className={`mt-3 min-h-11 rounded-lg border border-sage bg-white px-3 py-2 text-xs font-semibold text-dark-green transition-colors hover:border-dark-green ${FOCUS_RING}`}
            >
              Check again
            </button>
          </div>
        )}

        {mealTypes.status === 'ready' && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {mealTypeOptions.map((type) => {
                const checked = values.selectedMealTypeIds.includes(type.id);
                const blocked = !checked && atMealTypeLimit;
                return (
                  <button
                    key={type.id}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    disabled={blocked}
                    onClick={() => actions.toggleMealType(type.id)}
                    className={`flex min-h-11 items-center gap-2.5 rounded-xl border-2 px-3.5 py-3 text-left text-sm capitalize transition-all ${FOCUS_RING} ${
                      checked
                        ? 'border-dark-green bg-green/10 font-semibold text-charcoal'
                        : blocked
                          ? 'cursor-not-allowed border-sage bg-white font-medium text-slate/40'
                          : 'border-sage bg-white font-medium text-slate hover:border-dark-green/50'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        checked
                          ? 'border-dark-green bg-dark-green text-white'
                          : 'border-sage bg-white'
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    {type.label}
                  </button>
                );
              })}
            </div>
            {atMealTypeLimit && (
              <p className="mt-3 text-xs text-slate">
                That&apos;s the maximum of {MAX_MEALS_PER_DAY} meals a day. Deselect one to swap.
              </p>
            )}
            {errors.mealTypeIds && (
              <p role="alert" className="mt-3 text-xs font-medium text-tomato">
                {errors.mealTypeIds}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── What that actually works out to ──
          Plain arithmetic, from the same shared helper the API uses to create
          the plan — so this per-meal figure is the one the dashboard will show.
          The old version drew one identical bar per meal, which encoded no
          information beyond the number already printed beside it. */}
      {mealTypes.status === 'ready' &&
        values.mealsPerDay > 0 &&
        Number.isFinite(values.totalBudget) && (
          <div className={cardClass}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate">
              What that works out to
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <div className="font-display text-2xl font-bold text-charcoal">
                  {formatPKR(breakdown.perMeal)}
                </div>
                <div className="mt-0.5 text-xs text-slate">per meal</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-charcoal">
                  {formatPKR(breakdown.perDay)}
                </div>
                <div className="mt-0.5 text-xs text-slate">per day</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-charcoal">
                  {breakdown.totalMeals}
                </div>
                <div className="mt-0.5 text-xs text-slate">meals planned</div>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate">
              {formatPKR(values.totalBudget)} across {breakdown.days} days ·{' '}
              {selectedMealTypes.map((type) => type.label).join(', ')} · split evenly to start. The
              AI shifts money between meals as you log what you actually spend.
            </p>
          </div>
        )}
    </div>
  );
};
