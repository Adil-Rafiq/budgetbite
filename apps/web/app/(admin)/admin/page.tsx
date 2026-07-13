'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  ClipboardList,
  Database,
  ScrollText,
  Store,
  UsersRound,
  UtensilsCrossed,
} from 'lucide-react';
import { useAdminMetrics } from '@/hooks/use-admin-metrics';
import { Spinner } from '@/components/ui/spinner';

const sections = [
  {
    href: '/admin/restaurants',
    label: 'Restaurants',
    description: 'Browse, edit, and remove restaurants and their menu items.',
    icon: Store,
  },
  {
    href: '/admin/meal-types',
    label: 'Meal types',
    description: 'Manage the meal types users can plan around.',
    icon: UtensilsCrossed,
  },
  {
    href: '/admin/users',
    label: 'Users',
    description: 'Manage accounts and admin access.',
    icon: UsersRound,
  },
  {
    href: '/admin/plans',
    label: 'Plans',
    description: 'Inspect AI-generated budget plans.',
    icon: ClipboardList,
  },
  {
    href: '/admin/ingestion',
    label: 'Ingestion',
    description: 'Scraper run history and volume.',
    icon: Database,
  },
  {
    href: '/admin/audit',
    label: 'Audit log',
    description: 'Every admin and scraper mutation.',
    icon: ScrollText,
  },
];

function MetricTile({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-xl border border-sage bg-white px-4 py-3 shadow-sm">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate/60">{label}</div>
      <div className="mt-1 font-mono text-[22px] font-semibold tabular-nums text-charcoal">
        {value ?? '—'}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { data: metrics, isLoading } = useAdminMetrics();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-green">
          Admin · Overview
        </div>
        <h1 className="font-display text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.05] tracking-tight text-charcoal">
          Admin.
        </h1>
        <p className="text-[14px] text-slate">Manage the data that powers BudgetBite.</p>
      </header>

      {isLoading ? (
        <div className="mt-6 flex items-center justify-center py-10">
          <Spinner className="size-5 text-slate" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricTile label="Users" value={metrics?.users} />
          <MetricTile label="Admins" value={metrics?.admins} />
          <MetricTile label="Restaurants" value={metrics?.restaurants} />
          <MetricTile label="Menu items" value={metrics?.menuItems} />
          <MetricTile label="Active plans" value={metrics?.activePlans} />
          <MetricTile label="New (30d)" value={metrics?.signupsLast30Days} />
        </div>
      )}

      <h2 className="mt-10 font-mono text-[13px] uppercase tracking-[0.18em] text-slate/60">
        Manage
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-2xl border border-sage bg-white p-5 shadow-sm transition-all hover:border-green/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green/15 text-green">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate transition-colors group-hover:text-charcoal" />
            </div>
            <div>
              <div className="font-display text-[15px] font-semibold text-charcoal">{label}</div>
              <div className="mt-0.5 text-[13px] text-slate">{description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
