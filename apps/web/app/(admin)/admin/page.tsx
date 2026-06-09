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

const labelStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' };

function MetricTile({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-xl border border-lumen-dk bg-white px-4 py-3">
      <div className="text-[10px] uppercase text-soft" style={labelStyle}>
        {label}
      </div>
      <div
        className="mt-1 text-[22px] font-semibold text-vast"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {value ?? '—'}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { data: metrics, isLoading } = useAdminMetrics();

  return (
    <div className="mx-auto max-w-5xl">
      <h1
        className="text-vast"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: '-0.02em',
        }}
      >
        Admin
      </h1>
      <p className="mt-1 text-[14px] text-ink">Manage the data that powers BudgetBite.</p>

      {isLoading ? (
        <div className="mt-6 flex items-center justify-center py-10">
          <Spinner className="size-5 text-soft" />
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

      <h2 className="mt-10 text-[13px] uppercase text-soft" style={labelStyle}>
        Manage
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-xl border border-lumen-dk bg-white p-5 transition-all hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.2)]"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-fathom/10 text-fathom">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-soft transition-colors group-hover:text-vast" />
            </div>
            <div>
              <div className="text-[15px] font-medium text-vast">{label}</div>
              <div className="mt-0.5 text-[13px] text-ink">{description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
