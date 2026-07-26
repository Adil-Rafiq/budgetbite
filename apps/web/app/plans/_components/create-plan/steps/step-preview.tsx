import { Bell, BellOff, CalendarDays, Utensils } from 'lucide-react';
import { format } from 'date-fns';
import { planBudgetBreakdown } from '@repo/shared';
import { useCreatePlanContext } from '@/app/plans/_context/create-plan-context';
import { formatPKR } from '@/lib/currency';
import { formatTimeOfDay } from '@/lib/time';

const eyebrowClass = 'text-[10px] font-semibold uppercase tracking-[0.18em] text-slate/60';

export const StepPreview = () => {
  const { steps } = useCreatePlanContext();
  const { values: budgetValues, mealTypeOptions } = steps.budget;
  const { values: notificationValues } = steps.notifications;

  const { planType, totalBudget, selectedMealTypeIds, mealsPerDay } = budgetValues;

  // Same shared arithmetic the API uses to create the plan. This preview used
  // to divide by an exclusive day count while the server counted inclusively,
  // so the per-meal figure here was ~12% higher than the one the dashboard
  // showed moments later.
  const {
    startDate,
    endDate,
    days,
    totalMeals,
    perMeal: avgPerMeal,
    perDay: avgPerDay,
  } = planBudgetBreakdown({ planType, totalBudget, mealsPerDay });

  const start = new Date(startDate);
  const end = new Date(endDate);

  const selectedMealLabels = mealTypeOptions
    .filter((opt) => selectedMealTypeIds.includes(opt.id))
    .map((opt) => opt.label);

  const enabledReminders = notificationValues.slots.filter((s) => s.enabled);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-sage bg-canvas p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className={eyebrowClass}>Total budget</span>
            <p className="font-display text-[28px] font-semibold leading-tight tracking-tight text-charcoal">
              {formatPKR(totalBudget)}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-sage bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-charcoal">
            {planType}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <PreviewStat label="Per day" value={formatPKR(avgPerDay)} />
          <PreviewStat label="Per meal" value={formatPKR(avgPerMeal)} />
        </div>
      </div>

      <PreviewRow icon={CalendarDays} label="Window">
        <span className="text-[13px] text-charcoal">
          {format(start, 'MMM d')} → {format(end, 'MMM d')}
        </span>
        <span className="text-[11px] text-slate/60">
          {days} day{days === 1 ? '' : 's'} · {totalMeals} meals
        </span>
      </PreviewRow>

      <PreviewRow icon={Utensils} label="Meal types">
        {selectedMealLabels.length === 0 ? (
          <span className="text-[12px] text-slate/60">none selected</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selectedMealLabels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-sage bg-canvas px-2 py-0.5 text-[11px] capitalize text-charcoal"
              >
                {label}
              </span>
            ))}
          </div>
        )}
        <span className="text-[11px] text-slate/60">
          {mealsPerDay} meal{mealsPerDay === 1 ? '' : 's'}/day
        </span>
      </PreviewRow>

      <PreviewRow
        icon={enabledReminders.length > 0 ? Bell : BellOff}
        label={enabledReminders.length > 0 ? 'Reminders' : 'Reminders off'}
      >
        {notificationValues.slots.length === 0 ? (
          <span className="text-[12px] text-slate/60">none configured</span>
        ) : (
          <div className="flex flex-col gap-1">
            {notificationValues.slots.map((slot) => (
              <div
                key={slot.mealTypeId}
                className={`flex items-center justify-between text-[12px] ${
                  slot.enabled ? 'text-charcoal' : 'text-slate/60'
                }`}
              >
                <span className="capitalize">{slot.label}</span>
                <span>{slot.enabled ? formatTimeOfDay(slot.time) : 'off'}</span>
              </div>
            ))}
          </div>
        )}
      </PreviewRow>
    </div>
  );
};

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-sage bg-white p-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate/60">{label}</p>
      <p className="mt-0.5 font-display text-sm font-semibold tracking-tight text-charcoal">
        {value}
      </p>
    </div>
  );
}

function PreviewRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-sage bg-white p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green/10 text-green">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate/60">
          {label}
        </span>
        {children}
      </div>
    </div>
  );
}
