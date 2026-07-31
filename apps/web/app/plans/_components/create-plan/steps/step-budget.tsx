import { CalendarDays, CalendarRange, RefreshCw } from 'lucide-react';
import { useCreatePlanContext } from '@/app/plans/_context/create-plan-context';
import { MealTypeChoiceGroup } from '@/components/budget/meal-type-choice-group';
import { formatPKR } from '@/lib/currency';
import { FOCUS_RING } from '@/lib/focus-ring';

const labelClass = 'text-[10px] font-semibold uppercase tracking-[0.18em] text-slate/60';

export const StepBudgetDetails = () => {
  const { steps, mealTypes } = useCreatePlanContext();
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

  const selectedMealLabels = mealTypeOptions
    .filter((type) => values.selectedMealTypeIds.includes(type.id))
    .map((type) => type.label);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Plan type ──
          A segmented toggle, not a 110px dropdown: weekly vs monthly is a 4x
          difference in the amount below it, and it deserves to look like a
          decision rather than a setting. */}
      <div className="flex flex-col gap-2">
        <span className={labelClass}>Plan type</span>
        <div
          role="group"
          aria-label="Budget period"
          className="flex gap-1 rounded-2xl border border-sage bg-canvas p-1"
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
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition-all ${FOCUS_RING} ${
                  active
                    ? 'bg-green-deep text-white shadow-sm shadow-green-deep/20'
                    : 'bg-transparent text-slate hover:text-charcoal'
                }`}
              >
                <Icon aria-hidden className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Budget amount ── */}
      <div className="flex flex-col gap-2">
        <label htmlFor="budget" className={labelClass}>
          Total budget (PKR)
        </label>
        <div className="flex items-end gap-2.5">
          <span aria-hidden className="pb-1 font-display text-xl font-bold text-green-deep">
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
            className={`min-w-0 flex-1 border-b-2 border-sage bg-transparent pb-1 font-display text-3xl font-bold text-charcoal transition-colors placeholder:text-slate/30 focus:border-green-deep ${FOCUS_RING}`}
          />
          <span id="budget-period" className="pb-1.5 text-[12px] text-slate">
            / {values.planType === 'weekly' ? 'week' : 'month'}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[11px] text-slate">Quick pick:</span>
          {presets.map((preset) => {
            const active = values.totalBudget === preset;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={active}
                onClick={() => actions.setTotalBudget(preset)}
                className={`min-h-11 rounded-full border px-3 text-[11px] font-medium transition-colors ${FOCUS_RING} ${
                  active
                    ? 'border-green-deep bg-green/10 font-semibold text-green-deep'
                    : 'border-sage text-slate hover:border-green-deep hover:text-green-deep'
                }`}
              >
                {formatPKR(preset)}
              </button>
            );
          })}
        </div>

        {lastConversion && !errors.totalBudget && (
          <p className="mt-1 flex items-start gap-2 rounded-xl border border-sage bg-canvas px-3 py-2 text-[11px] text-slate">
            <RefreshCw aria-hidden className="mt-0.5 h-3 w-3 shrink-0 text-green-deep" />
            <span>
              Converted {formatPKR(lastConversion.from)} to{' '}
              <span className="font-semibold text-charcoal">{formatPKR(lastConversion.to)}</span> so
              it means the same spend per day. Edit it if that is not what you wanted.
            </span>
          </p>
        )}

        {errors.totalBudget && (
          <p role="alert" className="text-[11px] font-medium text-tomato-ink">
            {errors.totalBudget}
          </p>
        )}
      </div>

      {/* ── Meal types ── */}
      <div className="flex flex-col gap-2">
        <span className={labelClass}>Meal types</span>

        {mealTypes.status === 'loading' && (
          <div className="flex flex-wrap gap-2" aria-busy="true" aria-label="Loading meal types">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-11 w-24 animate-pulse rounded-full border border-sage bg-canvas"
              />
            ))}
          </div>
        )}

        {mealTypes.status === 'error' && (
          <div
            role="alert"
            className="flex flex-col items-start gap-2 rounded-lg border border-tomato/30 bg-tomato/5 p-3 text-[12px]"
          >
            <div className="font-medium text-tomato-ink">Couldn&apos;t load meal types</div>
            <div className="text-[11px] text-slate">
              This is usually a dropped connection. Your budget is kept on this device, so nothing
              is lost if you retry.
            </div>
            <button
              type="button"
              onClick={mealTypes.refetch}
              className={`min-h-11 rounded-lg border border-sage bg-white px-3 text-[11px] font-semibold text-green-deep transition-colors hover:border-green-deep ${FOCUS_RING}`}
            >
              Try again
            </button>
          </div>
        )}

        {mealTypes.status === 'empty' && (
          <div className="rounded-lg border border-sage bg-canvas p-3 text-[12px] text-charcoal">
            <div className="font-medium">No meal types available yet</div>
            <div className="mt-0.5 text-[11px] text-slate">
              An admin still needs to configure these. Please reach out to support so we can get you
              set up.
            </div>
          </div>
        )}

        {mealTypes.status === 'ready' && (
          <>
            <MealTypeChoiceGroup
              label="Meal types this plan covers"
              options={mealTypeOptions}
              selectedIds={values.selectedMealTypeIds}
              onToggle={actions.toggleMealType}
              atLimit={atMealTypeLimit}
              variant="inline"
            />
            {errors.mealTypeIds && (
              <p role="alert" className="text-[11px] font-medium text-tomato-ink">
                {errors.mealTypeIds}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── What that actually works out to ──
          The wizard used to print "Meals/day = 3 · based on selected types" — an
          equation, in a grey box, that answered a question nobody asks. The
          question people do ask is what the amount buys per meal, and it used to
          require walking two steps forward to the preview and back. */}
      {mealTypes.status === 'ready' &&
        values.mealsPerDay > 0 &&
        Number.isFinite(values.totalBudget) && (
          <div className="rounded-xl border border-sage bg-canvas p-3">
            <div className="grid grid-cols-3 gap-2">
              <BreakdownFigure value={formatPKR(breakdown.perMeal)} label="per meal" />
              <BreakdownFigure value={formatPKR(breakdown.perDay)} label="per day" />
              <BreakdownFigure value={String(breakdown.totalMeals)} label="meals planned" />
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-slate">
              {formatPKR(values.totalBudget)} across {breakdown.days} days ·{' '}
              {selectedMealLabels.join(', ')} · split evenly to start. The AI shifts money between
              meals as you log what you actually spend.
            </p>
          </div>
        )}
    </div>
  );
};

function BreakdownFigure({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-lg font-bold tabular-nums text-charcoal">{value}</div>
      <div className="mt-0.5 text-[10px] text-slate">{label}</div>
    </div>
  );
}
