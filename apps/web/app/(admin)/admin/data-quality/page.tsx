'use client';

import Link from 'next/link';
import type { DataQualityGroup } from '@repo/shared';
import { useAdminDataQuality } from '@/hooks/use-admin-data-quality';
import { Spinner } from '@/components/ui/spinner';

function Section({
  title,
  description,
  group,
  linkRestaurants,
}: {
  title: string;
  description: string;
  group: DataQualityGroup;
  linkRestaurants?: boolean;
}) {
  const clean = group.count === 0;
  return (
    <div className="rounded-xl border border-sage bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-medium text-charcoal">{title}</h2>
        <span
          className={`font-mono text-[18px] font-semibold ${clean ? 'text-dark-green' : 'text-tomato'}`}
        >
          {group.count}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-slate/60">{description}</p>
      {!clean && (
        <ul className="mt-3 flex flex-col gap-1 border-t border-sage pt-3">
          {group.sample.map((e) => (
            <li key={e.id} className="truncate text-[13px] text-slate">
              {linkRestaurants ? (
                <Link href={`/admin/restaurants/${e.id}`} className="hover:text-dark-green">
                  {e.name}
                </Link>
              ) : (
                e.name
              )}
            </li>
          ))}
          {group.count > group.sample.length && (
            <li className="text-[12px] text-slate/60">+ {group.count - group.sample.length} more</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function AdminDataQualityPage() {
  const { data, isLoading, isError } = useAdminDataQuality();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[26px] font-semibold tracking-tight text-charcoal">
        Data quality
      </h1>
      <p className="mt-1 text-[14px] text-slate">
        Gaps in the catalog that degrade plan quality. Lower is better.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="size-5 text-slate/60" />
        </div>
      ) : isError || !data ? (
        <div className="py-16 text-center text-[14px] text-slate/60">
          Could not load the report. Try again.
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Section
            title="Restaurants without items"
            description="No menu items — invisible to the planner."
            group={data.restaurantsWithoutItems}
            linkRestaurants
          />
          <Section
            title="Restaurants without a rating"
            description="Missing rating weakens ranking."
            group={data.restaurantsWithoutRating}
            linkRestaurants
          />
          <Section
            title="Stale restaurants"
            description={`Not updated in over ${data.staleDays} days.`}
            group={data.staleRestaurants}
            linkRestaurants
          />
          <Section
            title="Items with invalid price"
            description="Price is zero or negative."
            group={data.itemsInvalidPrice}
          />
        </div>
      )}
    </div>
  );
}
