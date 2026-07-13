'use client';

import { CalendarDays, CalendarRange, Check, Wand2 } from 'lucide-react';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import type { BudgetPlanType } from '@/app/onboarding/types';

const SLIDER_CONFIG: Record<
  BudgetPlanType,
  { min: number; max: number; step: number; presets: number[]; days: number }
> = {
  weekly: { min: 1000, max: 50000, step: 500, presets: [3500, 7500, 12000, 20000], days: 7 },
  monthly: { min: 5000, max: 200000, step: 2000, presets: [15000, 30000, 45000, 60000], days: 30 },
};

const formatRs = (n: number) => `₨ ${Math.round(n).toLocaleString('en-PK')}`;

const cardClass = 'rounded-[20px] border border-sage bg-white p-5 shadow-sm sm:p-6';

export const BudgetStep = () => {
  const { steps, mealTypes } = useOnboardingContext();
  const { values, actions, errors, mealTypeOptions } = steps.budget;

  const config = SLIDER_CONFIG[values.planType];
  const sliderValue = Math.min(Math.max(values.totalBudget, config.min), config.max);
  const perDay = values.totalBudget / config.days;
  const perMeal = values.mealsPerDay > 0 ? perDay / values.mealsPerDay : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Plan type segmented toggle ── */}
      <div className="flex gap-1 rounded-[18px] border border-sage bg-white p-2 shadow-sm">
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
              onClick={() => actions.setPlanType(type)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                active
                  ? 'bg-green text-white shadow-md shadow-green/30'
                  : 'bg-transparent text-slate hover:text-charcoal'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Budget amount + slider + presets ── */}
      <div className={cardClass}>
        <label
          htmlFor="budget"
          className="text-xs font-semibold uppercase tracking-wide text-slate"
        >
          Total food budget
        </label>
        <div className="mt-4 mb-5 flex items-end gap-3">
          <span className="pb-1 font-display text-2xl font-bold">₨</span>
          <input
            id="budget"
            type="number"
            min={1}
            value={values.totalBudget}
            onChange={(event) => actions.setTotalBudget(Number(event.target.value))}
            className="min-w-0 flex-1 border-b-2 border-sage bg-transparent pb-1 font-display text-4xl font-bold text-green outline-none transition-colors focus:border-green sm:text-5xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="pb-2 text-sm text-slate">
            / {values.planType === 'weekly' ? 'week' : 'month'}
          </span>
        </div>

        <input
          type="range"
          aria-label="Budget amount"
          min={config.min}
          max={config.max}
          step={config.step}
          value={sliderValue}
          onChange={(event) => actions.setTotalBudget(Number(event.target.value))}
          className="bb-range mb-3 w-full"
        />
        <div className="mb-5 flex justify-between text-xs text-slate">
          <span>{formatRs(config.min)}</span>
          <span>{formatRs(config.max)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 self-center text-xs text-slate">Quick pick:</span>
          {config.presets.map((preset) => {
            const active = values.totalBudget === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => actions.setTotalBudget(preset)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-green bg-green/5 text-green'
                    : 'border-sage text-slate hover:border-green hover:text-green'
                }`}
              >
                {formatRs(preset)}
              </button>
            );
          })}
        </div>
        {errors.totalBudget && <p className="mt-3 text-xs text-tomato">{errors.totalBudget}</p>}
      </div>

      {/* ── Meal types ── */}
      <div className={cardClass}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate">
          Which meals do you eat out?
        </p>

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
              Check your connection and try again. If this keeps happening, please contact support.
            </div>
            <button
              type="button"
              onClick={mealTypes.refetch}
              className="text-xs font-semibold text-green underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {mealTypes.status === 'empty' && (
          <div className="rounded-xl border border-sage bg-canvas p-4 text-sm">
            <div className="font-semibold text-charcoal">No meal types available yet</div>
            <div className="mt-0.5 text-xs text-slate">
              An admin still needs to configure these. Please reach out to support so we can get you
              set up.
            </div>
          </div>
        )}

        {mealTypes.status === 'ready' && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {mealTypeOptions.map((type) => {
                const checked = values.selectedMealTypeIds.includes(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => actions.toggleMealType(type.id)}
                    className={`flex items-center gap-2.5 rounded-xl border-2 px-3.5 py-3 text-left text-sm capitalize transition-all ${
                      checked
                        ? 'border-green bg-green/5 font-semibold text-charcoal'
                        : 'border-sage bg-white font-medium text-slate hover:border-green/40'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        checked ? 'border-green bg-green text-white' : 'border-sage bg-white'
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    {type.label}
                  </button>
                );
              })}
            </div>
            {errors.mealTypeIds && <p className="mt-3 text-xs text-tomato">{errors.mealTypeIds}</p>}
          </>
        )}
      </div>

      {/* ── Derived breakdown (equal split — honest, no invented weights) ── */}
      {mealTypes.status === 'ready' && values.mealsPerDay > 0 && (
        <div className={cardClass}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green/15">
                <Wand2 className="h-3.5 w-3.5 text-green" />
              </span>
              <span className="text-sm font-semibold">Budget breakdown</span>
            </div>
            <span className="text-xs text-slate">≈ {formatRs(perMeal)} per meal</span>
          </div>
          <div className="space-y-3">
            {mealTypeOptions
              .filter((type) => values.selectedMealTypeIds.includes(type.id))
              .map((type) => (
                <div key={type.id}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="capitalize text-slate">{type.label}</span>
                    <span className="font-semibold text-charcoal">{formatRs(perMeal)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-sage/50">
                    <div
                      className="h-full rounded-full bg-green"
                      style={{ width: `${100 / values.mealsPerDay}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
          <p className="mt-4 text-xs text-slate">
            Split evenly across {values.mealsPerDay} meal{values.mealsPerDay > 1 ? 's' : ''} a day ·
            about {formatRs(perDay)} daily. The AI adjusts per meal as it plans.
          </p>
        </div>
      )}
    </div>
  );
};
