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
export type MapFilterId =
  | 'all'
  | 'no-items'
  | 'no-rating'
  | 'stale'
  | 'community'
  | 'outlier'
  | 'stacked';

/** What a matcher needs to know beyond the pin itself. */
export interface MapFilterContext {
  staleBefore: number;
  /**
   * Restaurants sharing an exact coordinate with at least one other.
   *
   * A set rather than a flag on the pin because it is a fact about a *group*
   * — no single row can tell you it is a duplicate — and it is derived on the
   * client, where the whole catalogue is already loaded.
   */
  stackedIds: ReadonlySet<string>;
}

export interface MapFilter {
  id: MapFilterId;
  label: string;
  /** What it costs the product, for the chip's title and the empty state. */
  consequence: string;
  /** Chips for a defect read as an alarm; chips for a slice read as neutral. */
  tone: 'neutral' | 'warn' | 'blocking';
  matches: (pin: AdminMapPin, ctx: MapFilterContext) => boolean;
}

/**
 * Groups the catalogue by exact coordinate and returns the ids of everything
 * that shares one.
 *
 * Two restaurants at the same point is a scraper artefact, not a fact about
 * the world — a building holds more than one business, but not at seven
 * decimal places of agreement. It matters beyond tidiness: distance sorting
 * cannot order them, the map cannot draw them apart at any zoom, and a reader
 * who clicks the pin gets whichever one happened to be on top.
 */
export function findStackedIds(pins: readonly AdminMapPin[]): Set<string> {
  const byCoordinate = new Map<string, string[]>();
  for (const pin of pins) {
    const key = `${pin.latitude.toFixed(6)},${pin.longitude.toFixed(6)}`;
    const bucket = byCoordinate.get(key);
    if (bucket) bucket.push(pin.id);
    else byCoordinate.set(key, [pin.id]);
  }
  const stacked = new Set<string>();
  for (const ids of byCoordinate.values()) {
    if (ids.length > 1) for (const id of ids) stacked.add(id);
  }
  return stacked;
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
    id: 'stacked',
    label: 'Same coordinates',
    consequence:
      'Shares an exact coordinate with another restaurant — no zoom level can draw them apart.',
    tone: 'blocking',
    matches: (pin, ctx) => ctx.stackedIds.has(pin.id),
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
