'use client';

import { CalendarDays, CalendarRange, RefreshCw } from 'lucide-react';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { MealTypeChoiceGroup } from '@/components/budget/meal-type-choice-group';
import { formatPKR } from '@/lib/currency';
import { FOCUS_RING } from '@/lib/focus-ring';

const cardClass = 'rounded-[20px] border border-sand bg-surface p-5 shadow-sm sm:p-6';

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
        className="flex gap-1 rounded-[18px] border border-sand bg-surface p-2 shadow-sm"
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
                  ? 'bg-teal-deep text-white shadow-md shadow-teal-ink/25'
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
          <span aria-hidden className="pb-1 font-display text-2xl font-bold text-teal-ink">
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
            className={`min-w-0 flex-1 border-b-2 border-sand bg-transparent pb-1 font-display text-4xl font-bold text-charcoal transition-colors placeholder:text-slate/30 focus:border-teal-ink sm:text-5xl ${FOCUS_RING}`}
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
                    ? 'border-teal-ink bg-teal/10 font-semibold text-teal-ink'
                    : 'border-sand text-slate hover:border-teal-ink hover:text-teal-ink'
                }`}
              >
                {formatPKR(preset)}
              </button>
            );
          })}
        </div>

        {lastConversion && !errors.totalBudget && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-sand bg-canvas px-3 py-2 text-xs text-slate">
            <RefreshCw aria-hidden className="mt-0.5 h-3 w-3 shrink-0 text-teal-ink" />
            <span>
              Converted {formatPKR(lastConversion.from)} to{' '}
              <span className="font-semibold text-charcoal">{formatPKR(lastConversion.to)}</span> so
              it means the same spend per day. Edit it if that is not what you wanted.
            </span>
          </p>
        )}

        {errors.totalBudget && (
          <p role="alert" className="mt-3 text-xs font-medium text-tomato-ink">
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
                className="h-[42px] w-28 animate-pulse rounded-xl border border-sand bg-canvas"
              />
            ))}
          </div>
        )}

        {mealTypes.status === 'error' && (
          <div
            role="alert"
            className="flex flex-col items-start gap-2 rounded-xl border border-tomato/30 bg-tomato/5 p-4 text-sm"
          >
            <div className="font-semibold text-tomato-ink">Couldn&apos;t load meal types</div>
            <div className="text-xs text-slate">
              This is usually a dropped connection. Your budget is saved on this device, so nothing
              is lost if you retry.
            </div>
            <button
              type="button"
              onClick={mealTypes.refetch}
              className={`min-h-11 rounded-lg border border-sand bg-surface px-3 py-2 text-xs font-semibold text-teal-ink transition-colors hover:border-teal-ink ${FOCUS_RING}`}
            >
              Try again
            </button>
          </div>
        )}

        {mealTypes.status === 'empty' && (
          <div className="rounded-xl border border-sand bg-canvas p-4 text-sm">
            <div className="font-semibold text-charcoal">No meal types available yet</div>
            <div className="mt-0.5 text-xs leading-relaxed text-slate">
              Meal types are configured by an admin, and none exist yet. Setup can&apos;t finish
              until at least one is added.
            </div>
            <button
              type="button"
              onClick={mealTypes.refetch}
              className={`mt-3 min-h-11 rounded-lg border border-sand bg-surface px-3 py-2 text-xs font-semibold text-teal-ink transition-colors hover:border-teal-ink ${FOCUS_RING}`}
            >
              Check again
            </button>
          </div>
        )}

        {mealTypes.status === 'ready' && (
          <>
            <MealTypeChoiceGroup
              label="Which meals do you eat out?"
              options={mealTypeOptions}
              selectedIds={values.selectedMealTypeIds}
              onToggle={actions.toggleMealType}
              atLimit={atMealTypeLimit}
              variant="grid"
            />
            {errors.mealTypeIds && (
              <p role="alert" className="mt-3 text-xs font-medium text-tomato-ink">
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
