'use client';

import Link from 'next/link';
import { ArrowRight, CircleAlert, CircleCheck, CircleDot } from 'lucide-react';
import { useAdminMetrics } from '@/hooks/use-admin-metrics';
import { useAdminDataQuality } from '@/hooks/use-admin-data-quality';
import { useAdminIngestionHealth } from '@/hooks/use-admin-ingestion-health';
import { Spinner } from '@/components/ui/spinner';
import { ADMIN_NAV_GROUPS } from '@/lib/admin-nav';
import { timeAgoLabel } from '@/lib/date';
import { FOCUS_RING, FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';

/**
 * How a check reads at a glance.
 *
 * `blocking` is a defect that would put a wrong number in front of a user — a
 * ₨0 price, a restaurant the planner can pick but nobody can order from. It
 * outranks `warn`, which is a record that is merely incomplete. The old page
 * ranked nothing: six metric tiles of equal weight, none of which said whether
 * anything was wrong.
 */
type Tone = 'ok' | 'warn' | 'blocking';

const TONE_ICON = {
  ok: CircleCheck,
  warn: CircleDot,
  blocking: CircleAlert,
} as const;

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-teal-deep',
  warn: 'text-amber-ink',
  blocking: 'text-tomato-ink',
};

interface Check {
  tone: Tone;
  label: string;
  /** The figure itself — the thing being counted, or a time. */
  value: string;
  /** What it costs the product when this is not clean. */
  consequence: string;
  href: string;
}

function CheckRow({ check }: { check: Check }) {
  const Icon = TONE_ICON[check.tone];
  return (
    <Link
      href={check.href}
      className={`group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-canvas ${FOCUS_RING}`}
    >
      {/* The icon shape differs per tone, not just its colour — a status
          carried by hue alone is invisible to a third of the reasons this page
          exists. */}
      <Icon aria-hidden className={`h-4 w-4 shrink-0 ${TONE_TEXT[check.tone]}`} />
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-charcoal">{check.label}</span>
        <span className="mt-0.5 block text-[12.5px] text-slate-muted">{check.consequence}</span>
      </span>
      <span
        className={`shrink-0 font-mono text-[15px] font-semibold tabular-nums ${TONE_TEXT[check.tone]}`}
      >
        {check.value}
      </span>
      <ArrowRight
        aria-hidden
        className="h-3.5 w-3.5 shrink-0 text-slate-muted transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

export default function AdminOverviewPage() {
  const { data: metrics } = useAdminMetrics();
  const { data: quality, isLoading: qualityLoading } = useAdminDataQuality();
  const { data: ingestion, isLoading: ingestionLoading } = useAdminIngestionHealth();

  const isLoading = qualityLoading || ingestionLoading;

  const invalidPrice = quality?.itemsInvalidPrice.count ?? 0;
  const withoutItems = quality?.restaurantsWithoutItems.count ?? 0;
  const stale = quality?.staleRestaurants.count ?? 0;
  const staleDays = quality?.staleDays ?? 0;
  const blockingCount = invalidPrice + withoutItems;

  const lastScrape = timeAgoLabel(ingestion?.lastSucceeded?.startedAt ?? null);

  // The verdict, in the product's own terms. "Records that would mislead a
  // plan" is what the operator is actually protecting against; counts of users
  // and menu items never told them whether they were winning.
  const verdict = ingestion?.isBroken
    ? {
        tone: 'blocking' as Tone,
        headline: 'Ingestion is broken.',
        detail: lastScrape
          ? `The newest scraper run failed. The last successful run was ${lastScrape}, so menu prices are drifting out of date.`
          : 'The newest scraper run failed, and no successful run is on record.',
      }
    : blockingCount > 0
      ? {
          tone: 'blocking' as Tone,
          headline: `${blockingCount} ${blockingCount === 1 ? 'record' : 'records'} would mislead a plan.`,
          detail:
            'A meal priced at zero makes a plan under-count spend; a restaurant with no items can be planned around but never ordered from.',
        }
      : stale > 0
        ? {
            tone: 'warn' as Tone,
            headline: 'Catalogue is orderable.',
            detail: `Nothing would produce a wrong number today, but ${stale} ${stale === 1 ? 'restaurant has' : 'restaurants have'} not changed in ${staleDays} days.`,
          }
        : {
            tone: 'ok' as Tone,
            headline: 'Catalogue is trustworthy.',
            detail:
              'Every restaurant has orderable items at plausible prices, and ingestion is current.',
          };

  const VerdictIcon = TONE_ICON[verdict.tone];

  const checks: Check[] = [
    {
      tone: invalidPrice > 0 ? 'blocking' : 'ok',
      label: 'Menu items priced at zero or less',
      consequence: 'Every plan containing one under-counts what the user will actually spend.',
      value: String(invalidPrice),
      href: '/admin/data-quality',
    },
    {
      tone: withoutItems > 0 ? 'blocking' : 'ok',
      label: 'Restaurants with no menu items',
      consequence: 'The planner can suggest them, but there is nothing to order.',
      value: String(withoutItems),
      href: '/admin/data-quality',
    },
    {
      tone: ingestion?.isBroken ? 'blocking' : lastScrape ? 'ok' : 'warn',
      label: 'Last successful scrape',
      consequence: ingestion?.isBroken
        ? `${ingestion.consecutiveFailures} ${ingestion.consecutiveFailures === 1 ? 'run has' : 'runs have'} failed since.`
        : 'Menu prices are only as current as the run that fetched them.',
      value: lastScrape ?? 'never',
      href: '/admin/ingestion',
    },
    {
      tone: stale > 0 ? 'warn' : 'ok',
      label: `Restaurants unchanged for ${staleDays}+ days`,
      consequence: 'Prices shown to users may no longer match the source.',
      value: String(stale),
      href: '/admin/data-quality',
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-[26px] font-semibold tracking-tight text-charcoal">
        Overview
      </h1>
      <p className="mt-1 text-[14px] text-slate">
        Whether the data behind BudgetBite&rsquo;s meal plans can be trusted right now.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-5 text-slate-muted" />
        </div>
      ) : (
        <>
          {/* The verdict leads, and it is type rather than a tile: this is a
              sentence the operator reads once, not a figure they compare. */}
          <section
            aria-label="Status"
            className="mt-6 flex items-start gap-3 border-t-2 border-charcoal pt-5"
          >
            <VerdictIcon
              aria-hidden
              className={`mt-1 h-5 w-5 shrink-0 ${TONE_TEXT[verdict.tone]}`}
            />
            <div className="min-w-0">
              <h2 className="font-display text-[clamp(20px,2.6vw,26px)] font-semibold leading-tight tracking-tight text-charcoal">
                {verdict.headline}
              </h2>
              <p className="mt-1.5 max-w-[62ch] text-[13.5px] leading-relaxed text-slate">
                {verdict.detail}
              </p>
            </div>
          </section>

          <h2 className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-muted">
            checks
          </h2>
          <div className="mt-2 divide-y divide-sand overflow-hidden rounded-xl border border-sand bg-white">
            {checks.map((check) => (
              <CheckRow key={check.label} check={check} />
            ))}
          </div>

          {/* Scale is context, not news — one quiet line, not six tiles that
              compete with the verdict above them. */}
          <p className="mt-5 font-mono text-[12px] tabular-nums text-slate-muted">
            {metrics
              ? `${metrics.restaurants} restaurants · ${metrics.menuItems} menu items · ${metrics.activePlans} active plans · ${metrics.totalGenerations} plans generated · ${metrics.users} users`
              : '—'}
          </p>

          <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-muted">
            manage
          </h2>
          {/* Driven from ADMIN_NAV_GROUPS rather than a second hand-kept list.
              The two had already drifted — the rail carried ten destinations
              and this carried six — and the rail is hidden below `lg`, so three
              routes were reachable only by typing the URL. */}
          <div className="mt-3 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {ADMIN_NAV_GROUPS.filter((g) => g.label).map((group) => (
              <div key={group.label}>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-muted">
                  {group.label}
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`group -mx-2 flex min-h-11 flex-col justify-center rounded-lg px-2 py-1 transition-colors hover:bg-white ${FOCUS_RING_ON_CANVAS}`}
                      >
                        <span className="text-[14px] font-medium text-charcoal group-hover:text-teal-deep">
                          {item.label}
                        </span>
                        <span className="text-[12.5px] text-slate-muted">{item.description}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
