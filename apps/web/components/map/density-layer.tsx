'use client';

import { Fragment, useMemo, useState, type CSSProperties } from 'react';
import L from 'leaflet';
import { Circle, Marker, useMap, useMapEvents } from 'react-leaflet';
import type { UserDensityCell } from '@repo/shared';
import { densityStep } from '@repo/shared';

/**
 * Where the users are, as one circle per grid square.
 *
 * The API bins every location into a fixed grid and returns one count per
 * square, so the honest question is how to draw a count that belongs to an
 * area rather than to a point. The first answer here was to fill the square
 * itself — a choropleth. That is the right form when the bins tessellate, and
 * the wrong one here: a handful of squares scattered across a city do not
 * cover it, so they read as slabs dropped on the map, meeting corner-to-corner
 * in a chequerboard and hiding the streets, the neighbourhoods and the
 * restaurants the operator is looking at them *against*.
 *
 * Graduated circles fix all three. Area is proportional to the count, so a
 * square holding eleven people is visibly heavier than one holding four
 * without anything being painted out. They sit inside their square rather than
 * filling it, which understates the bin's extent rather than overstating it —
 * the safe direction to be wrong in. And because the radius is capped at half
 * the cell, two of them can never touch, which disposes of the usual objection
 * to circles on a map: overlapping translucent discs summing their opacity
 * until three sparse cells look darker than one busy one.
 *
 * The hue is `chart-5`, the palette's purple. Restaurants own teal on this
 * canvas; drawing people in teal as well is what left the two unreadable where
 * they met.
 */

/** Rungs on the opacity ramp. Nothing outside this file needs it — the legend
 *  keys off counts now, not off step indices. */
const DENSITY_STEPS = 5;

/**
 * Metres per degree, near enough. Latitude is effectively constant; longitude
 * closes up with the cosine, so at Lahore a 0.02° cell is ~2.2 km tall and
 * ~1.9 km wide. Taking the smaller of the two keeps the circle inside the
 * square on both axes.
 */
function maxRadiusMetres(cellDegrees: number, latitude: number): number {
  const northSouth = cellDegrees * 110_574;
  const eastWest = cellDegrees * 111_320 * Math.cos((latitude * Math.PI) / 180);
  return Math.min(northSouth, eastWest) / 2;
}

/**
 * Below this a circle is a speck, and a speck reads as a rendering fault
 * rather than as a small number. The floor breaks strict proportionality at
 * the bottom of the scale; the alternative is a mark the operator cannot see,
 * which communicates nothing at all.
 */
const MIN_RADIUS_METRES = 240;

/** Pixel radius under which the printed count would not fit inside its circle. */
const LABEL_MIN_PIXEL_RADIUS = 15;

interface DensityLayerProps {
  cells: readonly UserDensityCell[];
  /** Grid resolution; a cell spans this much from its south-west corner. */
  cellDegrees: number;
}

/** Re-renders on settle so the count labels can drop out when circles shrink. */
function useSettledZoom(): number {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  return zoom;
}

export function DensityLayer({ cells, cellDegrees }: DensityLayerProps) {
  const zoom = useSettledZoom();

  // The ramp describes the data on screen. Pinning it to some absolute scale
  // would render a whole city as one barely-tinted step just because a bigger
  // deployment somewhere else has thousands per square.
  const max = useMemo(() => cells.reduce((m, c) => Math.max(m, c.count), 0), [cells]);

  return (
    <>
      {cells.map((cell) => {
        const step = densityStep(cell.count, max, DENSITY_STEPS);
        // The circle is drawn at the square's middle, not at its corner, which
        // is the only coordinate the API reports.
        const centre: [number, number] = [cell.lat + cellDegrees / 2, cell.lng + cellDegrees / 2];
        // Square root, so *area* tracks the count. Scaling the radius directly
        // is the standard way a symbol map triples the apparent size of a
        // number that only doubled.
        const radius = Math.max(
          MIN_RADIUS_METRES,
          maxRadiusMetres(cellDegrees, centre[0]) * Math.sqrt(cell.count / Math.max(max, 1)),
        );

        // Leaflet draws circles in metres, so they shrink as the operator zooms
        // out. Past a point the number no longer fits inside its own circle.
        const metresPerPixel = (156_543.03392 * Math.cos((centre[0] * Math.PI) / 180)) / 2 ** zoom;
        const showCount = radius / metresPerPixel >= LABEL_MIN_PIXEL_RADIUS;

        return (
          // A Fragment, not a wrapper element: react-leaflet children attach
          // themselves to the map's panes, and a real `div` here would be
          // appended into the map container instead.
          <Fragment key={`${cell.lat}:${cell.lng}`}>
            <Circle
              center={centre}
              radius={radius}
              // The grid annotates the map; it must never be what you click
              // when you meant to click the restaurant underneath it.
              interactive={false}
              // Colour lives in CSS rather than in `fillColor`/`color` props so
              // it can be a themed token. Leaflet writes those options out as
              // SVG presentation attributes, where `var()` does not resolve — a
              // prop would have to be a resolved literal, which is a patch of
              // one theme stranded in the other.
              className={`bb-density bb-density--${step + 1}`}
              pathOptions={{ weight: 1.25 }}
            />
            {showCount && (
              <Marker
                position={centre}
                interactive={false}
                keyboard={false}
                // Above the restaurant markers, because the densest squares are
                // exactly the ones with pins piled on them, and a count buried
                // under a cluster is a count nobody reads. It costs nothing:
                // the label is `pointer-events: none`, so the pins underneath
                // still take every click.
                zIndexOffset={1000}
                icon={L.divIcon({
                  className: 'bb-density-count',
                  html: `<span class="bb-density__count">${cell.count}</span>`,
                  iconSize: [34, 18],
                  iconAnchor: [17, 9],
                })}
                ref={(marker) => marker?.getElement()?.setAttribute('aria-hidden', 'true')}
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}

/**
 * The key to the circles above.
 *
 * States the cell size and the suppression rule, because without them the map
 * is quietly misleading in a specific way: a blank stretch reads as "nobody
 * lives here" when some of it means "fewer than three people live here, and we
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
   * map. So the empty case leads with the explanation and drops the key,
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

  // Three sized examples rather than a gradient bar: the layer encodes with
  // area now, and a key has to be read in the channel the map actually uses.
  // The middle rung is dropped when the range is too narrow to place one.
  const middle = Math.round((minCellCount + max) / 2);
  const rungs = [minCellCount, middle, max].filter(
    (value, index, all) => all.indexOf(value) === index,
  );
  const KEY_MAX_PX = 26;
  const keySize = (count: number) =>
    Math.max(10, Math.round(KEY_MAX_PX * Math.sqrt(count / Math.max(max, 1))));

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-sand bg-surface p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-muted">
          users per square
        </span>
        <span className="font-mono text-[11px] tabular-nums text-slate-muted">~{cellKm} km</span>
      </div>

      <div className="flex items-end gap-4 px-0.5">
        {rungs.map((count) => (
          <span key={count} className="flex flex-col items-center gap-1.5">
            <span
              className="bb-density-key"
              style={{ '--bb-key-size': `${keySize(count)}px` } as CSSProperties}
            />
            <span className="font-mono text-[11px] tabular-nums leading-none text-slate">
              {count}
            </span>
          </span>
        ))}
      </div>

      <p className="text-[11.5px] leading-relaxed text-slate-muted">
        {suppressed > 0 ? (
          <>
            Squares with fewer than {minCellCount} users are not drawn, so no one circle can point
            at a person. {suppressed} {suppressed === 1 ? 'user is' : 'users are'} in one.
          </>
        ) : (
          <>Squares with fewer than {minCellCount} users are not drawn.</>
        )}
      </p>
    </div>
  );
}
