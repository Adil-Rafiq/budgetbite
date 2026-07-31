'use client';

import { RotateCw } from 'lucide-react';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useMealChoices } from '@/hooks/use-meal-choice';
import { useListActiveMealTypes } from '@/hooks/use-meal-type';
import { formatPKR } from '@/lib/currency';

export function RecentActivity() {
  const { data: activePlan } = useActiveBudgetPlan();
  const planId = activePlan?.plan.id ?? '';
  const { data, isLoading, error, refetch } = useMealChoices(planId, { limit: 5, offset: 0 });
  const { data: mealTypes = [] } = useListActiveMealTypes();

  const mealTypesById = new Map(mealTypes.map((mt) => [mt.id, mt]));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-[28px]">
          Recent activity
        </h2>
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
          <div className="flex flex-col items-start gap-2 p-5">
            <p className="text-[13px] text-tomato-ink">Could not load recent activity.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-tomato/40 bg-white px-3 py-1.5 text-[12px] font-semibold text-tomato-ink transition-colors hover:bg-tomato/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : !planId ? (
          <p className="p-5 text-[13px] text-slate">No active plan yet.</p>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-start gap-1 p-5">
            <p className="text-[13px] font-medium text-charcoal">Nothing logged yet.</p>
            <p className="text-[12px] text-slate">Choose a meal above to start tracking.</p>
          </div>
        ) : (
          <ul className="flex flex-col">
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
                <li
                  key={item.id}
                  className={`flex items-center justify-between gap-4 px-5 py-3.5 ${
                    i === 0 ? '' : 'border-t border-sage'
                  } ${i % 2 === 0 ? 'bg-white' : 'bg-canvas'}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-green/10 text-[12px] font-semibold text-green-deep">
                      {label.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-[10px] font-semibold uppercase capitalize tracking-wide text-slate">
                        {label}
                      </span>
                      <span className="truncate text-[14px] font-medium text-charcoal">{name}</span>
                      <span className="truncate text-[12px] text-slate">{restaurant}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-display text-[15px] font-bold text-charcoal">
                      {formatPKR(item.actualAmountSpent)}
                    </span>
                    <span className="text-[11px] text-slate">
                      {new Date(`${item.slotDate}T00:00:00`).toLocaleDateString('en-PK', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="px-1 text-center text-[11px] text-slate">
        All logged meals are private to your account.
      </p>
    </section>
  );
}
