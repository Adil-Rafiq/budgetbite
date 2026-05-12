'use client';

import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useMealChoices } from '@/hooks/use-meal-choice';
import { useListActiveMealTypes } from '@/hooks/use-meal-type';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

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
          <span
            className="text-[10px] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
          >
            /history
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: VAST,
            }}
          >
            Recent activity
          </h2>
        </div>
        <span
          className="text-[11px]"
          style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
        >
          last 5 entries
        </span>
      </div>

      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: WHITE, border: `1px solid ${LUMEN_DK}` }}
      >
        {isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse"
                style={{
                  background: i % 2 === 0 ? WHITE : 'rgba(228,228,208,0.25)',
                  borderTop: i === 0 ? 'none' : `1px solid ${LUMEN_DK}`,
                }}
              />
            ))}
          </div>
        ) : error ? (
          <p
            className="p-5 text-[13px]"
            style={{ color: PULSE }}
          >
            Could not load recent activity.
          </p>
        ) : !planId ? (
          <p className="p-5 text-[13px]" style={{ color: MUTED }}>
            No active plan yet.
          </p>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-start gap-1 p-5">
            <p
              className="text-[13px]"
              style={{ color: VAST, fontWeight: 500 }}
            >
              Nothing logged yet.
            </p>
            <p
              className="text-[12px]"
              style={{ color: MUTED, fontFamily: 'var(--font-mono)' }}
            >
              choose a meal above to start tracking.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {data.data.map((item, i) => {
              const mt = mealTypesById.get(item.mealTypeId);
              const label = mt?.label ?? 'Meal';
              const name = item.manualDescription ?? 'Suggested meal';
              const restaurant = item.restaurantName ?? '—';

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5"
                  style={{
                    borderTop: i === 0 ? 'none' : `1px solid ${LUMEN_DK}`,
                    background: i % 2 === 0 ? WHITE : 'rgba(228,228,208,0.18)',
                  }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px]"
                      style={{
                        background: 'rgba(3,79,70,0.10)',
                        color: FATHOM,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                      }}
                    >
                      {label.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] uppercase capitalize"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: SOFT,
                            letterSpacing: '0.18em',
                          }}
                        >
                          {label}
                        </span>
                      </div>
                      <span
                        className="truncate text-[14px]"
                        style={{ color: VAST, fontWeight: 500 }}
                      >
                        {name}
                      </span>
                      <span
                        className="truncate text-[12px]"
                        style={{ color: MUTED }}
                      >
                        {restaurant}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 15,
                        fontWeight: 700,
                        color: VAST,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      ₨ {item.actualAmountSpent.toLocaleString()}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
                    >
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
      <p
        className="px-1 text-center text-[11px]"
        style={{ fontFamily: 'var(--font-mono)', color: SOFT, background: LUMEN }}
      >
        all logged meals are private to your account.
      </p>
    </section>
  );
}
