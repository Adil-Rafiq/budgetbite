'use client';

import { useMemo } from 'react';
import { Rectangle, Tooltip } from 'react-leaflet';
import type { UserDensityCell } from '@repo/shared';
import { densityStep } from '@repo/shared';

/**
 * Where the users are, as a grid of counts.
 *
 * Squares on the true cell bounds, not a blurred heat blob. The data *is*
 * binned — the API rounds every location into a fixed grid and returns one
 * number per square — and a smooth gradient would draw a continuous field that
 * was never measured, inviting the operator to read a hot spot at a resolution
 * the data does not have. Overlapping translucent discs, the other common
 * choice, additionally sum their opacity, so three sparse cells can render
 * darker than one busy one.
 *
 * The ramp is a single hue, light to dark, from `--color-teal` mixed into the
 * page's own canvas. That mix is what makes it correct in both themes without a
 * second palette: on cream, more users means darker; on the near-black canvas
 * the identical formula runs the other way and more users means brighter, which
 * is the direction a dark surface requires.
 */

export const DENSITY_STEPS = 5;

interface DensityLayerProps {
  cells: readonly UserDensityCell[];
  /** Grid resolution; a cell spans this much from its south-west corner. */
  cellDegrees: number;
}

export function DensityLayer({ cells, cellDegrees }: DensityLayerProps) {
  // The ramp describes the data on screen. Pinning it to some absolute scale
  // would render a whole city as one barely-tinted step just because a bigger
  // deployment somewhere else has thousands per square.
  const max = useMemo(() => cells.reduce((m, c) => Math.max(m, c.count), 0), [cells]);

  return (
    <>
      {cells.map((cell) => {
        const step = densityStep(cell.count, max, DENSITY_STEPS);
        return (
          <Rectangle
            key={`${cell.lat}:${cell.lng}`}
            bounds={[
              [cell.lat, cell.lng],
              [cell.lat + cellDegrees, cell.lng + cellDegrees],
            ]}
            // Colour lives in CSS rather than in a `fillColor` prop so it can be
            // a `color-mix` against the theme's canvas. A prop would have to be
            // a resolved literal, which is a patch of one theme stranded in the
            // other — the exact failure `check-tokens.mjs` polices elsewhere.
            className={`bb-density bb-density--${step + 1}`}
            // The grid annotates the map; it must never be what you click when
            // you meant to click the restaurant underneath it.
            interactive={false}
            pathOptions={{ stroke: false }}
          >
            <Tooltip direction="top" opacity={1} className="bb-map-tooltip">
              {cell.count} {cell.count === 1 ? 'user' : 'users'} in this square
            </Tooltip>
          </Rectangle>
        );
      })}
    </>
  );
}

/**
 * The key to the ramp above.
 *
 * States the cell size and the suppression rule, because without them the map
 * is quietly misleading in a specific way: an empty square reads as "nobody
 * lives here" when some of them mean "fewer than three people live here, and we
 * will not say where".
 */
export function DensityLegend({
  cells,
  cellDegrees,
  minCellCount,
  suppressed,
}: {
  cells: readonly UserDensityCell[];
  cellDegrees: number;
  minCellCount: number;
  suppressed: number;
}) {
  const max = cells.reduce((m, c) => Math.max(m, c.count), 0);
  // 0.02° is meaningless to a reader; kilometres are the unit the rest of the
  // product already speaks in (radius, distance-to-restaurant).
  const cellKm = (cellDegrees * 111).toFixed(1);

  /**
   * Nothing drawn is the state that needs the most words, not the fewest.
   *
   * An overlay that is switched on and paints nothing is indistinguishable
   * from an overlay that is broken, and the honest reason — every square is
   * below the anonymity floor — is not one a reader can deduce from an empty
   * map. So the empty case leads with the explanation and drops the ramp,
   * which would otherwise be a scale running from 3 to nothing.
   */
  if (cells.length === 0) {
    return (
      <div className="flex flex-col gap-1.5 rounded-xl border border-dashed border-sand bg-surface p-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-muted">
          users per square
        </span>
        <p className="text-[12px] font-medium text-charcoal">Nothing to draw yet.</p>
        <p className="text-[11.5px] leading-relaxed text-slate-muted">
          {suppressed > 0 ? (
            <>
              {suppressed} {suppressed === 1 ? 'user has' : 'users have'} a location, but{' '}
              {suppressed === 1 ? 'it sits' : 'they sit'} in squares holding fewer than{' '}
              {minCellCount} people. Those are withheld — a square that thin would point at a person
              rather than at a place. The overlay fills in once {minCellCount} users share one{' '}
              {cellKm} km square.
            </>
          ) : (
            <>
              No user has set a location yet. The overlay fills in once {minCellCount} users share
              one {cellKm} km square.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sand bg-surface p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-muted">
          users per square
        </span>
        <span className="font-mono text-[11px] tabular-nums text-slate-muted">~{cellKm} km</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] tabular-nums text-slate">{minCellCount}</span>
        <div className="flex h-3 flex-1 overflow-hidden rounded-full">
          {Array.from({ length: DENSITY_STEPS }, (_, i) => (
            <span key={i} className={`bb-density-swatch bb-density--${i + 1} flex-1`} />
          ))}
        </div>
        <span className="font-mono text-[11px] tabular-nums text-slate">{max}</span>
      </div>

      <p className="text-[11.5px] leading-relaxed text-slate-muted">
        {suppressed > 0 ? (
          <>
            Squares with fewer than {minCellCount} users are not drawn, so no one square can point
            at a person. {suppressed} {suppressed === 1 ? 'user is' : 'users are'} in one.
          </>
        ) : (
          <>Squares with fewer than {minCellCount} users are not drawn.</>
        )}
      </p>
    </div>
  );
}
