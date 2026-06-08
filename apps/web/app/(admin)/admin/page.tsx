'use client';

import Link from 'next/link';
import { ArrowUpRight, Store, UtensilsCrossed } from 'lucide-react';

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
];

export default function AdminOverviewPage() {
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
