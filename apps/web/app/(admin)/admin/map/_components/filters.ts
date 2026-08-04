import type { AdminMapPin } from '@repo/shared';

/**
 * The defects the coverage map can isolate, named exactly as
 * `/admin/data-quality` names them.
 *
 * Two screens describing the same broken record with two different words send
 * the operator hunting for a second problem that does not exist. The map adds
 * one class the report cannot have — a coordinate is only wrong relative to the
 * other coordinates, which is a question you can ask of a map and not of a
 * table.
 */
export type MapFilterId = 'all' | 'no-items' | 'no-rating' | 'stale' | 'community' | 'outlier';

export interface MapFilter {
  id: MapFilterId;
  label: string;
  /** What it costs the product, for the chip's title and the empty state. */
  consequence: string;
  /** Chips for a defect read as an alarm; chips for a slice read as neutral. */
  tone: 'neutral' | 'warn' | 'blocking';
  matches: (pin: AdminMapPin, ctx: { staleBefore: number }) => boolean;
}

export const MAP_FILTERS: MapFilter[] = [
  {
    id: 'all',
    label: 'All',
    consequence: 'Every restaurant in the catalogue.',
    tone: 'neutral',
    matches: () => true,
  },
  {
    id: 'outlier',
    label: 'Bad coordinates',
    consequence: 'Plotted at (0, 0) or far from every other restaurant — nobody can be near it.',
    tone: 'blocking',
    matches: (pin) => pin.isOutlier,
  },
  {
    id: 'no-items',
    label: 'No menu items',
    consequence: 'The planner can suggest them, but there is nothing to order.',
    tone: 'blocking',
    matches: (pin) => pin.menuItemCount === 0,
  },
  {
    id: 'no-rating',
    label: 'No rating',
    consequence: 'Cannot be filtered or sorted by quality.',
    tone: 'warn',
    matches: (pin) => pin.rating == null,
  },
  {
    id: 'stale',
    label: 'Stale',
    consequence: 'Prices shown to users may no longer match the source.',
    tone: 'warn',
    matches: (pin, ctx) => new Date(pin.updatedAt).getTime() < ctx.staleBefore,
  },
  {
    id: 'community',
    label: 'Community',
    consequence: 'Added by a user rather than scraped from Foodpanda.',
    tone: 'neutral',
    matches: (pin) => pin.source === 'community',
  },
];

export const isMapFilterId = (value: string | null): value is MapFilterId =>
  value != null && MAP_FILTERS.some((f) => f.id === value);

export function staleCutoff(staleDays: number): number {
  return Date.now() - staleDays * 24 * 60 * 60 * 1000;
}
