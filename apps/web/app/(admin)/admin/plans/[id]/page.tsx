'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { AdminPlanGeneration, AdminPlanSuggestion } from '@repo/shared';
import { useAdminPlan } from '@/hooks/use-admin-plans';
import { formatPKR } from '@/lib/currency';
import { Spinner } from '@/components/ui/spinner';
import { DataError } from '@/components/data-error';

const money = (n: number): string => formatPKR(n);

const genStatusClass: Record<AdminPlanGeneration['status'], string> = {
  pending: 'bg-amber-tint text-amber-ink',
  succeeded: 'bg-teal/15 text-teal-ink',
  failed: 'bg-tomato/10 text-tomato-ink',
  superseded: 'bg-sand/50 text-slate-muted',
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-sand bg-surface px-3 py-2.5">
      <div className="font-mono tracking-[0.18em] text-[10px] uppercase text-slate-muted">
        {label}
      </div>
      <div className="mt-1 text-[15px] font-medium text-charcoal">{value}</div>
    </div>
  );
}

function groupByDate(suggestions: AdminPlanSuggestion[]): [string, AdminPlanSuggestion[]][] {
  const map = new Map<string, AdminPlanSuggestion[]>();
  for (const s of suggestions) {
    const bucket = map.get(s.slotDate) ?? [];
    bucket.push(s);
    map.set(s.slotDate, bucket);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default function AdminPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: plan, isLoading, isError, refetch } = useAdminPlan(params.id);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/plans"
        className="inline-flex items-center gap-1.5 text-[13px] text-slate-muted transition-colors hover:text-slate"
      >
        <ArrowLeft className="size-4" />
        Plans
      </Link>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="size-5 text-slate-muted" />
        </div>
      ) : isError || !plan ? (
        <div className="mt-6">
          <DataError message="Could not load this plan." onRetry={() => refetch()} />
        </div>
      ) : (
        <>
          <h1 className="mt-3 font-display text-[26px] font-semibold tracking-tight text-charcoal">
            {plan.user.name}
          </h1>
          <p className="mt-1 font-mono text-[13px] text-slate-muted">
            {plan.user.email} · {plan.planType} · {plan.status} · {plan.startDate} → {plan.endDate}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Budget" value={money(plan.totalBudget)} />
            <Stat label="Meals / day" value={String(plan.mealsPerDay)} />
            {plan.context && <Stat label="Spent" value={money(plan.context.amountSpent)} />}
            {plan.context && <Stat label="Remaining" value={money(plan.context.amountRemaining)} />}
          </div>

          {plan.mealTypes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {plan.mealTypes.map((mt) => (
                <span
                  key={mt.id}
                  className="inline-flex items-center rounded-full bg-sand/50 px-2.5 py-0.5 text-[12px] text-slate"
                >
                  {mt.label}
                </span>
              ))}
            </div>
          )}

          <h2 className="font-mono tracking-[0.18em] mt-8 text-[13px] uppercase text-slate-muted">
            Generations
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {plan.generations.length === 0 ? (
              <p className="text-[14px] text-slate-muted">No generations yet.</p>
            ) : (
              plan.generations.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-lg border border-sand bg-surface px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${genStatusClass[g.status]}`}
                    >
                      {g.status}
                    </span>
                    <span className="text-[13px] text-slate-muted">
                      {new Date(g.generatedAt).toLocaleString()}
                    </span>
                    {g.id === plan.activeGenerationId && (
                      <span className="text-[11px] text-teal-ink">active</span>
                    )}
                  </div>
                  {g.errorCode && (
                    <span className="font-mono text-[12px] text-tomato-ink">{g.errorCode}</span>
                  )}
                </div>
              ))
            )}
          </div>

          <h2 className="font-mono tracking-[0.18em] mt-8 text-[13px] uppercase text-slate-muted">
            Active suggestions
          </h2>
          <div className="mt-3 flex flex-col gap-5">
            {plan.suggestions.length === 0 ? (
              <p className="text-[14px] text-slate-muted">
                No suggestions for the active generation.
              </p>
            ) : (
              groupByDate(plan.suggestions).map(([date, items]) => (
                <div key={date}>
                  <div className="text-[12px] font-medium text-slate">{date}</div>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {items.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-lg border border-sand bg-surface px-3 py-2"
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-[14px] text-charcoal">
                            {s.menuItems.map((mi) => mi.name).join(' + ') || '—'}
                          </span>
                          <span className="truncate text-[12px] text-slate-muted">
                            {s.mealType.label} · {s.restaurant.name}
                            {s.optionIndex > 0 && ` · option ${s.optionIndex + 1}`}
                          </span>
                        </div>
                        <span className="text-[13px] text-slate">{money(s.estimatedPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
