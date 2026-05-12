'use client';

import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';

const labelClass = 'text-[11px] uppercase text-ink';
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.16em',
};

export const BudgetStep = () => {
  const { steps } = useOnboardingContext();
  const { values, actions, errors, mealTypeOptions } = steps.budget;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className={labelClass} style={labelStyle}>
          Plan type
        </label>
        <div className="grid grid-cols-2 gap-2 rounded-full border border-lumen-dk bg-lumen p-1">
          {(['weekly', 'monthly'] as const).map((type) => {
            const active = values.planType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => actions.setPlanType(type)}
                className={`rounded-full px-4 py-2 text-[13px] font-medium capitalize transition ${
                  active ? 'bg-vast text-lumen' : 'bg-transparent text-vast'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="budget" className={labelClass} style={labelStyle}>
          Total budget
        </label>
        <div className="relative">
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-medium text-ink"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ₨
          </span>
          <input
            id="budget"
            type="number"
            min={1}
            value={values.totalBudget}
            onChange={(event) => actions.setTotalBudget(Number(event.target.value))}
            className="w-full rounded-[10px] border border-lumen-dk bg-white py-[11px] pl-8 pr-3.5 text-[18px] font-semibold text-vast outline-none"
            style={{ fontFamily: 'var(--font-display)' }}
          />
        </div>
        {errors.totalBudget && (
          <p className="text-[11px] text-pulse">{errors.totalBudget}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label className={labelClass} style={labelStyle}>
          Meal types
        </label>
        <div className="flex flex-wrap gap-2">
          {mealTypeOptions.map((type) => {
            const checked = values.selectedMealTypeIds.includes(type.id);
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => actions.toggleMealType(type.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] capitalize transition ${
                  checked
                    ? 'border-fathom bg-fathom/8 font-medium text-fathom'
                    : 'border-lumen-dk bg-white font-normal text-vast'
                }`}
              >
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-lumen ${
                    checked ? 'bg-fathom' : 'bg-white'
                  }`}
                  style={{
                    border: `1.5px solid var(--color-${checked ? 'fathom' : 'lumen-dk'})`,
                    fontSize: 9,
                    lineHeight: 1,
                  }}
                >
                  {checked && '✓'}
                </span>
                {type.label}
              </button>
            );
          })}
        </div>
        {errors.mealTypeIds && (
          <p className="text-[11px] text-pulse">{errors.mealTypeIds}</p>
        )}
      </div>

      <div className="rounded-xl border border-lumen-dk bg-lumen p-4 text-[13px] text-vast">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-fathom text-[11px] text-lumen"
          >
            ƒ
          </span>
          <div className="text-[13px]">
            <span className="text-ink" style={{ fontFamily: 'var(--font-mono)' }}>
              meals_per_day ={' '}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {values.mealsPerDay}
            </span>
            <span className="ml-2 text-ink">· derived from selected meal types</span>
          </div>
        </div>
      </div>
    </div>
  );
};
