'use client';

import Link from 'next/link';
import { CircleAlert, CircleCheck, CircleDot, RotateCw } from 'lucide-react';
import type { DataQualityGroup } from '@repo/shared';
import { useAdminDataQuality } from '@/hooks/use-admin-data-quality';
import { Spinner } from '@/components/ui/spinner';
import { DataError } from '@/components/data-error';
import { timeAgoLabel } from '@/lib/date';
import { FOCUS_RING, FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';

/**
 * `blocking` corrupts a plan the user can see: a ₨0 price makes the plan
 * under-count spend, and a restaurant with nothing on its menu can be
 * suggested but never ordered from. `incomplete` only weakens ranking.
 *
 * The distinction is the point of the page. Four equal cards ranked nothing,
 * so the defect that quietly breaks the product's arithmetic sat beside a
 * missing star rating at the same visual weight.
 */
type Severity = 'blocking' | 'incomplete';

interface GroupSpec {
  severity: Severity;
  title: string;
  /** What this costs the product, not what the query matched. */
  consequence: string;
  group: DataQualityGroup;
  /** Menu-item groups carry their parent restaurant; restaurant groups are their own. */
  kind: 'restaurant' | 'menuItem';
}

function href(kind: GroupSpec['kind'], e: DataQualityGroup['sample'][number]): string | null {
  if (kind === 'restaurant') return `/admin/restaurants/${e.id}`;
  // Deep-link straight to the item's edit form on its restaurant page, so the
  // fix is one click from the finding rather than a name to memorise.
  if (e.restaurantId) return `/admin/restaurants/${e.restaurantId}?item=${e.id}`;
  return null;
}

function Section({ spec }: { spec: GroupSpec }) {
  const { group, severity, kind } = spec;
  const clean = group.count === 0;
  const Icon = clean ? CircleCheck : severity === 'blocking' ? CircleAlert : CircleDot;
  const tone = clean
    ? 'text-teal-ink'
    : severity === 'blocking'
      ? 'text-tomato-ink'
      : 'text-amber-ink';

  return (
    <div className="rounded-xl border border-sand bg-surface p-4">
      <div className="flex items-start gap-3">
        <Icon aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[15px] font-medium text-charcoal">{spec.title}</h3>
            <span className={`shrink-0 font-mono text-[18px] font-semibold tabular-nums ${tone}`}>
              {group.count}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-slate-muted">{spec.consequence}</p>
        </div>
      </div>

      {!clean && (
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-sand pt-3">
          {group.sample.map((e) => {
            const to = href(kind, e);
            return (
              <li key={e.id} className="text-[13px]">
                {to ? (
                  <Link
                    href={to}
                    className={`-mx-1 flex items-baseline gap-2 rounded px-1 py-0.5 text-slate transition-colors hover:text-teal-ink ${FOCUS_RING}`}
                  >
                    <span className="truncate">{e.name}</span>
                    {e.restaurantName && (
                      <span className="shrink-0 truncate text-[12px] text-slate-muted">
                        {e.restaurantName}
                      </span>
                    )}
                  </Link>
                ) : (
                  <span className="flex items-baseline gap-2 px-1 py-0.5 text-slate">
                    <span className="truncate">{e.name}</span>
                  </span>
                )}
              </li>
            );
          })}
          {group.count > group.sample.length && (
            <li className="px-1 text-[12px] text-slate-muted">
              + {group.count - group.sample.length} more
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function AdminDataQualityPage() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useAdminDataQuality();

  const specs: GroupSpec[] = data
    ? [
        {
          severity: 'blocking',
          title: 'Items priced at zero or less',
          consequence: 'Every plan containing one under-counts what the user will actually spend.',
          group: data.itemsInvalidPrice,
          kind: 'menuItem',
        },
        {
          severity: 'blocking',
          title: 'Restaurants without items',
          consequence: 'The planner can suggest them, but there is nothing to order.',
          group: data.restaurantsWithoutItems,
          kind: 'restaurant',
        },
        {
          severity: 'incomplete',
          title: `Not updated in ${data.staleDays}+ days`,
          consequence: 'Prices shown to users may no longer match the source.',
          group: data.staleRestaurants,
          kind: 'restaurant',
        },
        {
          severity: 'incomplete',
          title: 'Restaurants without a rating',
          consequence: 'Ranking has less to go on when choosing between options.',
          group: data.restaurantsWithoutRating,
          kind: 'restaurant',
        },
      ]
    : [];

  const blocking = specs.filter((s) => s.severity === 'blocking');
  const incomplete = specs.filter((s) => s.severity === 'incomplete');
  const blockingCount = blocking.reduce((n, s) => n + s.group.count, 0);
  const checkedAgo = timeAgoLabel(dataUpdatedAt ? new Date(dataUpdatedAt) : null);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-charcoal">
            Data quality
          </h1>
          <p className="mt-1 text-[14px] text-slate">
            Records that would put a wrong number in front of a user, worst first.
          </p>
        </div>
        {/* The report is a snapshot, and a snapshot with no timestamp and no way
            to retake it cannot be trusted after the first fix. */}
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-sand bg-surface px-3 text-[12px] text-slate transition-colors hover:text-charcoal disabled:opacity-60 ${FOCUS_RING_ON_CANVAS}`}
        >
          {isFetching ? (
            <Spinner className="size-3.5" />
          ) : (
            <RotateCw aria-hidden className="h-3.5 w-3.5" />
          )}
          Re-check
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="size-5 text-slate-muted" />
        </div>
      ) : isError || !data ? (
        <div className="mt-6">
          <DataError message="Could not load the report." onRetry={() => refetch()} />
        </div>
      ) : (
        <>
          {/* An all-clean report used to render as four blank boxes, which reads
              as "nothing loaded" rather than "nothing is wrong". */}
          {blockingCount === 0 && (
            <div
              role="status"
              className="mt-6 flex items-start gap-3 rounded-xl border border-teal/30 bg-teal/[0.06] p-4"
            >
              <CircleCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-teal-ink" />
              <p className="text-[13.5px] leading-relaxed text-charcoal">
                No record would mislead a plan right now. Every restaurant has orderable items at
                plausible prices.
              </p>
            </div>
          )}

          <h2 className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-muted">
            blocks a correct plan
          </h2>
          <div className="mt-2 grid gap-3">
            {blocking.map((spec) => (
              <Section key={spec.title} spec={spec} />
            ))}
          </div>

          <h2 className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-muted">
            incomplete, but orderable
          </h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {incomplete.map((spec) => (
              <Section key={spec.title} spec={spec} />
            ))}
          </div>

          {checkedAgo && (
            <p className="mt-5 font-mono text-[12px] text-slate-muted">Checked {checkedAgo}.</p>
          )}
        </>
      )}
    </div>
  );
}
