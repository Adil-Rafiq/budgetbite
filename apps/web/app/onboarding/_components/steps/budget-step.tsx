'use client';

import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const WHITE = '#ffffff';
const MUTED = '#71716a';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: WHITE,
  border: `1px solid ${LUMEN_DK}`,
  borderRadius: 10,
  padding: '11px 14px',
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  color: VAST,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.16em',
  color: MUTED,
  fontSize: 11,
  textTransform: 'uppercase',
};

export const BudgetStep = () => {
  const { steps } = useOnboardingContext();
  const { values, actions, errors, mealTypeOptions } = steps.budget;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label style={labelStyle}>Plan type</label>
        <div
          className="grid grid-cols-2 gap-2 rounded-full p-1"
          style={{ background: LUMEN, border: `1px solid ${LUMEN_DK}` }}
        >
          {(['weekly', 'monthly'] as const).map((type) => {
            const active = values.planType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => actions.setPlanType(type)}
                className="rounded-full px-4 py-2 text-[13px] font-medium capitalize transition"
                style={{
                  background: active ? VAST : 'transparent',
                  color: active ? LUMEN : VAST,
                }}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="budget" style={labelStyle}>Total budget</label>
        <div className="relative">
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px]"
            style={{ fontFamily: 'var(--font-display)', color: MUTED, fontWeight: 500 }}
          >
            ₨
          </span>
          <input
            id="budget"
            type="number"
            min={1}
            value={values.totalBudget}
            onChange={(event) => actions.setTotalBudget(Number(event.target.value))}
            style={{
              ...inputStyle,
              paddingLeft: 32,
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 600,
            }}
          />
        </div>
        {errors.totalBudget && (
          <p className="text-[11px]" style={{ color: PULSE }}>
            {errors.totalBudget}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label style={labelStyle}>Meal types</label>
        <div className="flex flex-wrap gap-2">
          {mealTypeOptions.map((type) => {
            const checked = values.selectedMealTypeIds.includes(type.id);
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => actions.toggleMealType(type.id)}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] capitalize transition"
                style={{
                  borderColor: checked ? FATHOM : LUMEN_DK,
                  background: checked ? 'rgba(3,79,70,0.08)' : WHITE,
                  color: checked ? FATHOM : VAST,
                  fontWeight: checked ? 500 : 400,
                }}
              >
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full"
                  style={{
                    border: `1.5px solid ${checked ? FATHOM : LUMEN_DK}`,
                    background: checked ? FATHOM : WHITE,
                    color: LUMEN,
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
          <p className="text-[11px]" style={{ color: PULSE }}>
            {errors.mealTypeIds}
          </p>
        )}
      </div>

      <div
        className="rounded-xl border p-4 text-[13px]"
        style={{ borderColor: LUMEN_DK, background: LUMEN, color: VAST }}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
            style={{ background: FATHOM, color: LUMEN }}
          >
            ƒ
          </span>
          <div className="text-[13px]">
            <span style={{ fontFamily: 'var(--font-mono)', color: MUTED }}>meals_per_day = </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{values.mealsPerDay}</span>
            <span className="ml-2" style={{ color: MUTED }}>
              · derived from selected meal types
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
