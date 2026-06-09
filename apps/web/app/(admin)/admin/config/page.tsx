'use client';

import type { AdminConfig } from '@repo/shared';
import { useAdminConfig } from '@/hooks/use-admin-config';
import { Spinner } from '@/components/ui/spinner';

const rows: { key: keyof AdminConfig; label: string; description: string }[] = [
  {
    key: 'nearbyRadiusKm',
    label: 'NEARBY_RADIUS_KM',
    description: 'How far from the user restaurants are considered.',
  },
  {
    key: 'maxRestaurants',
    label: 'MAX_RESTAURANTS',
    description: 'Cap on restaurants fed into a plan generation.',
  },
  {
    key: 'maxItemsPerRestaurant',
    label: 'MAX_ITEMS_PER_RESTAURANT',
    description: 'Cap on menu items per restaurant sent to the AI.',
  },
  {
    key: 'replanDeviationThreshold',
    label: 'REPLAN_CUMULATIVE_DEVIATION_RATIO_THRESHOLD',
    description: 'Budget drift ratio that triggers a re-plan.',
  },
  { key: 'aiProvider', label: 'AI_PROVIDER', description: 'Active LLM provider.' },
  { key: 'aiModelName', label: 'AI_MODEL_NAME', description: 'Active model.' },
];

export default function AdminConfigPage() {
  const { data, isLoading, isError } = useAdminConfig();

  return (
    <div className="mx-auto max-w-3xl">
      <h1
        className="text-vast"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: '-0.02em',
        }}
      >
        Config
      </h1>
      <p className="mt-1 text-[14px] text-ink">
        Effective tuning values. These are environment-driven and read-only — change them in the
        deployment environment.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="size-5 text-soft" />
        </div>
      ) : isError || !data ? (
        <div className="py-16 text-center text-[14px] text-soft">
          Could not load config. Try again.
        </div>
      ) : (
        <div className="mt-6 divide-y divide-lumen-dk rounded-xl border border-lumen-dk bg-white">
          {rows.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <div
                  className="truncate text-[12px] text-ink"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {label}
                </div>
                <div className="mt-0.5 text-[12px] text-soft">{description}</div>
              </div>
              <div
                className="shrink-0 text-[13px] font-medium text-vast"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {data[key] ?? <span className="text-soft">unset</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
