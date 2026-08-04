import { haversineKm } from './haversine.js';

/**
 * Finding coordinates that cannot be right, for the admin coverage map.
 *
 * A bad coordinate is the one data defect a table cannot show. `latitude:
 * 0.0000000` looks exactly as plausible as `24.8607000` in a column of numbers,
 * and the restaurant it belongs to still has a name, a rating and a menu — so
 * it passes every check `dataQuality()` runs. On a map it is a dot in the Gulf
 * of Guinea. This module is what turns that from "obvious once you look" into
 * something the page can say out loud.
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/** How far from the pack a point has to sit before it is called a defect. */
export const DEFAULT_OUTLIER_THRESHOLD_KM = 300;

const median = (sorted: number[]): number => {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] as number;
  return ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
};

/**
 * The component-wise median of a set of points — the centre the rest of the
 * catalogue agrees on.
 *
 * Median rather than mean, and that is the whole point of the function. A mean
 * is dragged by exactly the values this module exists to find: one restaurant
 * at (0, 0) pulls the centre of a Karachi catalogue hundreds of kilometres into
 * the Arabian Sea, at which case the real cluster is now "far from centre" and
 * the null-island row is closer to it than half the good data. The defect would
 * hide itself. A median moves by at most one rank per bad row.
 *
 * Not a true geographic median (that would need an iterative solve on the
 * sphere), and it does not need to be: the threshold is 300 km, the catalogue
 * spans one metropolitan area, and nothing downstream measures from this point
 * except a "is it absurdly far" comparison.
 *
 * Returns null for an empty set — there is no centre of nothing, and callers
 * must not get (0, 0) handed back as if it were one.
 */
export function medianCenter(points: readonly GeoPoint[]): GeoPoint | null {
  if (points.length === 0) return null;
  const lats = points.map((p) => p.latitude).sort((a, b) => a - b);
  const lngs = points.map((p) => p.longitude).sort((a, b) => a - b);
  return { latitude: median(lats), longitude: median(lngs) };
}

/** True for the null-island coordinate, allowing for float dust. */
export function isNullIsland(point: GeoPoint): boolean {
  return Math.abs(point.latitude) < 1e-9 && Math.abs(point.longitude) < 1e-9;
}

export interface FlagOutliersOptions {
  thresholdKm?: number;
}

/**
 * Marks each point as an outlier or not, preserving input order.
 *
 * Two independent rules, because they catch different mistakes:
 *
 *  - **(0, 0) is always a defect**, checked before any distance maths. It is
 *    what an unparsed or missing coordinate degrades to, never a place we have
 *    a restaurant. Unconditional matters in the degenerate case: if a broken
 *    scraper run wrote null island to *most* rows, the median itself is (0, 0),
 *    every distance is zero, and a purely statistical rule would report a
 *    perfectly healthy catalogue.
 *
 *  - **Far from the median centre**, which catches the subtler case: a real
 *    coordinate for the wrong city, or swapped lat/lng — 24.86, 67.00 read
 *    backwards lands in Kazakhstan and is otherwise unremarkable.
 *
 * A single-point set has no pack to be far from, so only the (0, 0) rule can
 * fire — one restaurant is never geographically anomalous relative to itself.
 */
export function flagOutliers<T extends GeoPoint>(
  points: readonly T[],
  options: FlagOutliersOptions = {},
): (T & { isOutlier: boolean })[] {
  const { thresholdKm = DEFAULT_OUTLIER_THRESHOLD_KM } = options;

  // The centre is taken from the plausible points only. Including null island
  // in the median that judges null island lets a cluster of them vote on their
  // own legitimacy.
  const center = medianCenter(points.filter((p) => !isNullIsland(p)));

  return points.map((point) => {
    if (isNullIsland(point)) return { ...point, isOutlier: true };
    if (!center) return { ...point, isOutlier: false };
    const km = haversineKm(center.latitude, center.longitude, point.latitude, point.longitude);
    return { ...point, isOutlier: km > thresholdKm };
  });
}

/**
 * Which bucket of a sequential ramp a count belongs in — `0` is the lightest
 * step, `steps - 1` the darkest.
 *
 * Linear over the range rather than over `count` itself, so the ramp describes
 * the data it is actually drawn on: a density map whose busiest cell holds 9
 * users should use its full range, not render as one barely-tinted square
 * because some absolute scale expected thousands.
 *
 * `max <= 0` collapses to step 0 rather than dividing by zero, which is the
 * empty-map case and should draw nothing anyway.
 */
export function densityStep(count: number, max: number, steps: number): number {
  if (steps <= 1 || max <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, count / max));
  // `ceil` so any non-zero count clears step 0: a cell that exists is a cell
  // with people in it, and the palest step has to still read as "some".
  return Math.min(steps - 1, Math.max(0, Math.ceil(ratio * steps) - 1));
}
