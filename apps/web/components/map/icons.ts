import L from 'leaflet';

/**
 * The app's marker vocabulary, in one place.
 *
 * Two shapes, and the distinction carries meaning rather than decoration:
 *
 *  - **A teardrop is a point you set.** The onboarding picker's draggable pin,
 *    and "home" on the restaurant map. It has a tip, because it is claiming an
 *    exact spot on the ground.
 *  - **A dot is a place that exists.** Restaurants, on both maps. Dots stay
 *    legible at the density a catalogue produces, where three hundred teardrops
 *    would be a pile of overlapping tips pointing at each other.
 *
 * Colours are `var(--color-*)` rather than literals so the markers follow the
 * theme like everything else — a hardcoded pin fill is the exact failure
 * `check-tokens.mjs` exists to catch, and on a dark basemap it is the
 * difference between a marker and a smudge.
 */

/** Ships with every icon so hover/focus styling has something to hook. */
const BASE_CLASS = 'bb-marker';

/**
 * A place on the map: a filled disc with a light ring so it holds its edge
 * against both the cream and the near-black basemap.
 */
export function restaurantIcon(options: { selected?: boolean; dimmed?: boolean } = {}): L.DivIcon {
  const { selected = false, dimmed = false } = options;
  const size = selected ? 22 : 14;
  const fill = dimmed ? 'var(--color-slate-muted)' : 'var(--color-teal-deep)';

  return L.divIcon({
    className: [
      BASE_CLASS,
      'bb-marker--dot',
      selected ? 'bb-marker--selected' : '',
      dimmed ? 'bb-marker--dimmed' : '',
    ]
      .filter(Boolean)
      .join(' '),
    html: `<span class="bb-marker__dot" style="--bb-dot-size:${size}px;--bb-dot-fill:${fill}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * A coordinate that cannot be right.
 *
 * A triangle, not a red dot. Status carried by hue alone is invisible to a
 * meaningful share of the operators this page is for, and "the broken one" is
 * the single most important thing the coverage map has to say — so it gets a
 * silhouette that differs from every other marker at a glance, plus the alarm
 * colour on top of that.
 */
export function outlierIcon(options: { selected?: boolean } = {}): L.DivIcon {
  const { selected = false } = options;
  const size = selected ? 30 : 22;

  return L.divIcon({
    className: [BASE_CLASS, 'bb-marker--outlier', selected ? 'bb-marker--selected' : '']
      .filter(Boolean)
      .join(' '),
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.5 22.5 21H1.5z" fill="var(--color-tomato)" stroke="var(--color-surface)" stroke-width="1.75" stroke-linejoin="round"/>
      <rect x="11" y="9" width="2" height="6" rx="1" fill="var(--color-surface)"/>
      <rect x="11" y="16.5" width="2" height="2" rx="1" fill="var(--color-surface)"/>
    </svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Where the viewer is. A ringed puck rather than a pin, matching the
 * "you are here" convention every map app has already taught them, and
 * deliberately unlike the restaurant dots it sits among.
 */
export function homeIcon(): L.DivIcon {
  const size = 26;
  return L.divIcon({
    className: `${BASE_CLASS} bb-marker--home`,
    html: `<span class="bb-marker__home"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * The pin the user drags in the location picker. Extracted from
 * `location-map.tsx` so there is one pin in the app rather than two that drift.
 */
export function placedPinIcon(): L.DivIcon {
  return L.divIcon({
    className: 'wispr-pin',
    html: `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0z" fill="var(--color-tomato)"/>
      <circle cx="14" cy="14" r="5" fill="#ffffff"/>
    </svg>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -34],
  });
}

/**
 * Cluster diameter for a given member count.
 *
 * Stepped on a square-root scale, so a bubble's *area* tracks the number
 * inside it. Sizing by diameter — the obvious version — makes a cluster of 100
 * look ten times heavier than a cluster of 10 rather than the intended three,
 * which is the standard way a cluster map overstates its own hot spots.
 */
export function clusterDiameter(count: number): number {
  const MIN = 34;
  const MAX = 62;
  // 400 is where the ramp saturates: past it, bubbles would crowd out the map
  // they annotate, and the number inside is doing the work anyway.
  const ratio = Math.min(1, Math.sqrt(count) / Math.sqrt(400));
  return Math.round(MIN + (MAX - MIN) * ratio);
}

/**
 * A group of places, labelled with how many.
 *
 * `isStack` marks a group that shares one coordinate and therefore will never
 * come apart, however far you zoom. It gets its own silhouette — a stacked
 * double ring — because the two kinds of bubble answer to different gestures:
 * an ordinary cluster rewards zooming, a stack only rewards a click. Drawing
 * them identically is what makes a map feel broken, since half the bubbles
 * stop responding to the gesture the other half taught.
 */
export function clusterIcon(
  count: number,
  options: { hasOutlier?: boolean; isStack?: boolean } = {},
): L.DivIcon {
  const size = clusterDiameter(count);
  // A cluster hiding a broken coordinate says so, rather than making the
  // operator zoom into every bubble to find out which one it is in.
  const tone = options.hasOutlier ? 'bb-cluster--alert' : '';
  const stack = options.isStack ? 'bb-cluster--stack' : '';

  return L.divIcon({
    className: `${BASE_CLASS} bb-cluster ${tone} ${stack}`.replace(/\s+/g, ' ').trim(),
    html: `<span class="bb-cluster__body" style="--bb-cluster-size:${size}px">${count}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
