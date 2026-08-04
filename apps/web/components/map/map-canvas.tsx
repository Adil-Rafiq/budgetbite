'use client';

import 'leaflet/dist/leaflet.css';

import type L from 'leaflet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { MapContainer, useMap, useMapEvents } from 'react-leaflet';

import { FOCUS_RING } from '@/lib/focus-ring';
import { ThemedTileLayer } from './themed-tile-layer';

/**
 * The base every map in the app is built on: themed tiles, real zoom buttons,
 * and a wheel that does not steal the page's scroll.
 */

/** Central Karachi — where the scraped catalogue lives. */
export const DEFAULT_CENTER: [number, number] = [24.8607, 67.0011];

/**
 * Whether the zoom gesture is a pinch (Apple trackpads) or a held modifier.
 *
 * Only ever read inside a map, and every map in the app is behind
 * `dynamic(..., { ssr: false })`, so there is no server render to disagree with.
 */
const APPLE_INPUT =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

/**
 * Move the view, honouring the reader's motion preference.
 *
 * `flyTo` is a curved, eased traversal of the whole distance between two
 * points. For someone with a vestibular sensitivity that is precisely the
 * gesture to avoid, and unlike a fading card it cannot be waited out — the
 * whole map is the thing moving. `setView` arrives at the same place instantly.
 */
export function moveMapTo(
  map: L.Map,
  center: L.LatLngExpression,
  zoom: number,
  reduceMotion: boolean,
): void {
  if (reduceMotion) map.setView(center, zoom, { animate: false });
  else map.flyTo(center, zoom, { duration: 0.55 });
}

/** Hands the Leaflet instance up to the page, which needs it to pan and fit. */
function MapReady({ onReady, label }: { onReady: (map: L.Map) => void; label: string }) {
  const map = useMap();

  useEffect(() => {
    onReady(map);
    // Leaflet measures its container on mount. Inside a panel that is still
    // settling — a flex row resolving, a dynamic import swapping out a skeleton
    // — it can measure zero and render a single tile in the corner.
    const raf = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(raf);
  }, [map, onReady]);

  /**
   * Names the element that actually takes focus.
   *
   * `aria-label` cannot be passed through `<MapContainer>`: it forwards only
   * `className`, `id` and `style` to the div and folds every other prop into
   * Leaflet's map options, where an aria attribute is silently ignored. Leaflet
   * meanwhile gives that same div `tabindex="0"` so its arrow keys can pan —
   * which left a focusable element in the tab order announcing nothing at all.
   */
  useEffect(() => {
    const container = map.getContainer();
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', label);
  }, [map, label]);

  return null;
}

/**
 * Cooperative wheel zoom, implemented by *withholding* the event rather than
 * by reimplementing zoom.
 *
 * A map embedded in a scrolling page that eats the wheel is a trap: the reader
 * flicks past it and instead of the page moving, the map zooms to street level.
 * So a plain wheel scrolls the page as it would anywhere else, and zooming asks
 * for a modifier — the bargain every embedded map on the web has taught.
 *
 * The first version hand-rolled the zoom itself, and it was broken in one
 * direction only: it called `setZoom(zoom ± 0.5)`, and Leaflet snaps that
 * through `Math.round(zoom / zoomSnap) * zoomSnap`. With the default snap of 1,
 * `Math.round` rounds halves *up* — so zooming in resolved 13.5 to 14 and
 * zooming out resolved 12.5 straight back to 13. You could zoom in and never
 * out. Half-steps are also wrong for a trackpad, which emits a stream of small
 * deltas rather than one notch per gesture.
 *
 * Leaflet's own handler already gets all of this right — accumulated deltas,
 * cursor-anchored zoom, correct snapping — so it stays enabled and this simply
 * stops the unmodified wheel from reaching it. The listener sits on the wrapper
 * in the capture phase, which runs before the event descends to the container
 * where Leaflet is listening; `stopPropagation` there means Leaflet never sees
 * it, and with no `preventDefault` the page scrolls exactly as it should.
 */
function useCooperativeWheel(wrapper: HTMLDivElement | null, enabled: boolean, onHint: () => void) {
  useEffect(() => {
    if (!wrapper || !enabled) return;

    const handleWheel = (event: WheelEvent) => {
      // Apple trackpad pinch arrives as a wheel event with ctrlKey set, so this
      // one test covers both "hold the modifier" and "pinch".
      if (event.ctrlKey || event.metaKey) return;
      event.stopPropagation();
      onHint();
    };

    wrapper.addEventListener('wheel', handleWheel, { capture: true });
    return () => wrapper.removeEventListener('wheel', handleWheel, { capture: true });
  }, [wrapper, enabled, onHint]);
}

/** Keeps the zoom buttons' disabled state honest at the min/max stops. */
function ZoomWatcher({ onChange }: { onChange: (zoom: number) => void }) {
  const map = useMapEvents({ zoomend: () => onChange(map.getZoom()) });
  return null;
}

interface MapCanvasProps {
  center?: [number, number];
  zoom?: number;
  /**
   * Names the region for screen readers. Required rather than defaulted: "map"
   * is not a label, and two unlabelled maps on one route are indistinguishable
   * in a landmark list.
   */
  label: string;
  /**
   * Wheel behaviour. `cooperative` (the default) leaves plain scrolling to the
   * page; `eager` claims the wheel, which is only correct when the map *is* the
   * page and there is nothing behind it to scroll.
   */
  wheel?: 'cooperative' | 'eager';
  onReady?: (map: L.Map) => void;
  className?: string;
  children?: React.ReactNode;
}

export function MapCanvas({
  center = DEFAULT_CENTER,
  zoom = 11,
  label,
  wheel = 'cooperative',
  onReady,
  className = '',
  children,
}: MapCanvasProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [wrapper, setWrapper] = useState<HTMLDivElement | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [showHint, setShowHint] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleReady = useCallback(
    (instance: L.Map) => {
      setMap(instance);
      onReady?.(instance);
    },
    [onReady],
  );

  const raiseHint = useCallback(() => {
    setShowHint(true);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setShowHint(false), 1600);
  }, []);

  useCooperativeWheel(wrapper, wheel === 'cooperative', raiseHint);

  useEffect(() => () => void (hintTimer.current && clearTimeout(hintTimer.current)), []);

  const atMinZoom = map ? currentZoom <= map.getMinZoom() : false;
  const atMaxZoom = map ? currentZoom >= map.getMaxZoom() : false;

  // Named for the platform the reader is on: on a Mac the gesture is a pinch,
  // and telling someone to hold a key they do not need is worse than silence.
  const hintText = APPLE_INPUT ? 'Pinch or hold ⌘ to zoom' : 'Hold Ctrl and scroll to zoom';

  const zoomButton = `flex h-11 w-11 items-center justify-center rounded-full border border-sand bg-surface text-charcoal shadow-sm transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`;

  return (
    <div ref={setWrapper} className={`relative isolate overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        // Always Leaflet's own handler. In `cooperative` mode the wrapper
        // withholds unmodified wheel events from it rather than the map running
        // a second, worse zoom implementation of its own.
        scrollWheelZoom
        // `canvas` is not right here: markers are divIcons, which are DOM.
        // The background matters though — it is what shows through while tiles
        // decode, and the Leaflet default is a light grey that flashes on a
        // dark page exactly like the wrong basemap would.
        style={{ height: '100%', width: '100%', background: 'var(--color-canvas)' }}
        className="h-full w-full"
      >
        <ThemedTileLayer />
        <MapReady onReady={handleReady} label={label} />
        <ZoomWatcher onChange={setCurrentZoom} />
        {children}
      </MapContainer>

      {/* Above Leaflet's own panes (z-400) and its controls (z-800). */}
      <div className="pointer-events-none absolute inset-0 z-[900]">
        <div className="pointer-events-auto absolute left-3 top-3 flex flex-col gap-1.5">
          <button
            type="button"
            aria-label="Zoom in"
            disabled={atMaxZoom}
            onClick={() => map?.zoomIn()}
            className={zoomButton}
          >
            <Plus aria-hidden className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            disabled={atMinZoom}
            onClick={() => map?.zoomOut()}
            className={zoomButton}
          >
            <Minus aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <div
          aria-hidden
          className={`absolute inset-0 flex items-center justify-center bg-canvas/55 transition-opacity duration-200 ${
            showHint ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backdropFilter: showHint ? 'blur(2px)' : 'none' }}
        >
          <span className="rounded-full border border-sand bg-surface px-4 py-2 text-[13px] font-medium text-charcoal shadow-sm">
            {hintText}
          </span>
        </div>
      </div>
    </div>
  );
}
