'use client';

import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useMealChoices } from '@/hooks/use-meal-choice';
import { useListActiveMealTypes } from '@/hooks/use-meal-type';

export function RecentActivity() {
  const { data: activePlan } = useActiveBudgetPlan();
  const planId = activePlan?.plan.id ?? '';
  const { data, isLoading, error } = useMealChoices(planId, { limit: 5, offset: 0 });
  const { data: mealTypes = [] } = useListActiveMealTypes();

  const mealTypesById = new Map(mealTypes.map((mt) => [mt.id, mt]));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-green">
            History
          </span>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal">
            Recent activity
          </h2>
        </div>
        <span className="text-[12px] text-slate">Last 5 entries</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-sage bg-white shadow-sm">
        {isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`h-14 animate-pulse ${i === 0 ? '' : 'border-t border-sage'} ${
                  i % 2 === 0 ? 'bg-white' : 'bg-canvas'
                }`}
              />
            ))}
          </div>
        ) : error ? (
          <p className="p-5 text-[13px] text-tomato">Could not load recent activity.</p>
        ) : !planId ? (
          <p className="p-5 text-[13px] text-slate">No active plan yet.</p>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-start gap-1 p-5">
            <p className="text-[13px] font-medium text-charcoal">Nothing logged yet.</p>
            <p className="text-[12px] text-slate">Choose a meal above to start tracking.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {data.data.map((item, i) => {
              const mt = mealTypesById.get(item.mealTypeId);
              const label = mt?.label ?? 'Meal';
              const name = item.isHomeCooked
                ? (item.manualDescription ?? 'Home-cooked meal')
                : (item.menuItemName ?? item.manualDescription ?? '—');
              const restaurant = item.isHomeCooked
                ? '🍳 Cooked at home'
                : (item.restaurantName ?? '—');

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-4 px-5 py-3.5 ${
                    i === 0 ? '' : 'border-t border-sage'
                  } ${i % 2 === 0 ? 'bg-white' : 'bg-canvas'}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-green/10 text-[12px] font-semibold text-green">
                      {label.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-[10px] font-semibold uppercase capitalize tracking-wide text-slate/60">
                        {label}
                      </span>
                      <span className="truncate text-[14px] font-medium text-charcoal">{name}</span>
                      <span className="truncate text-[12px] text-slate">{restaurant}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-display text-[15px] font-bold text-charcoal">
                      ₨ {item.actualAmountSpent.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate">
                      {new Date(item.slotDate).toLocaleDateString('en-PK', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <p className="px-1 text-center text-[11px] text-slate/60">
        All logged meals are private to your account.
      </p>
    </section>
  );
}
