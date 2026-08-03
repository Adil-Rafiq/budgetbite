'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect, useId, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

import { FOCUS_RING } from '@/lib/focus-ring';

const LEAFLET_ICON_BASE = 'https://unpkg.com/leaflet@1.9.4/dist/images/';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: `${LEAFLET_ICON_BASE}marker-icon-2x.png`,
  iconUrl: `${LEAFLET_ICON_BASE}marker-icon.png`,
  shadowUrl: `${LEAFLET_ICON_BASE}marker-shadow.png`,
});

const wisprIcon = L.divIcon({
  className: 'wispr-pin',
  html: `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0z" fill="var(--color-tomato)"/>
    <circle cx="14" cy="14" r="5" fill="#ffffff"/>
  </svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -34],
});

const round = (n: number) => Number(n.toFixed(4));

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

const isCoordinate = (value: number | null | undefined): value is number =>
  value != null && Number.isFinite(value);

interface LocationMapProps {
  /**
   * The picked coordinates, or null/undefined when nothing has been picked yet.
   * A null pair renders an empty map over `fallbackCenter` with no marker — the
   * map's opening view must never read as a location the user chose.
   */
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onCoordinatesChange: (latitude: number, longitude: number) => void;
  /** Where to look when there is no pin yet. Defaults to central Karachi. */
  fallbackCenter?: { latitude: number; longitude: number };
  height?: number;
}

function MapController({
  latitude,
  longitude,
}: {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
}) {
  const map = useMap();
  const lastApplied = useRef<{ lat: number; lng: number } | null>(
    isCoordinate(latitude) && isCoordinate(longitude) ? { lat: latitude, lng: longitude } : null,
  );

  useEffect(() => {
    if (!isCoordinate(latitude) || !isCoordinate(longitude)) return;
    const last = lastApplied.current;
    if (last && Math.abs(last.lat - latitude) < 1e-6 && Math.abs(last.lng - longitude) < 1e-6) {
      return;
    }
    lastApplied.current = { lat: latitude, lng: longitude };
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), 13), { duration: 0.6 });
  }, [latitude, longitude, map]);

  return null;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(round(e.latlng.lat), round(e.latlng.lng)),
  });
  return null;
}

function MapReady({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

export function LocationMap({
  latitude,
  longitude,
  onCoordinatesChange,
  fallbackCenter = { latitude: 24.8607, longitude: 67.0011 },
  height = 280,
}: LocationMapProps) {
  const hasPin = isCoordinate(latitude) && isCoordinate(longitude);
  const centerLat = hasPin ? latitude : fallbackCenter.latitude;
  const centerLng = hasPin ? longitude : fallbackCenter.longitude;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [address, setAddress] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsListRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  // Search (debounced)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setIsSearching(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('search failed');
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setActiveIndex(-1);
        setShowResults(true);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  // Reverse geocode (debounced) — resolves the picked spot to an address.
  // Skipped entirely until something is picked, so an unpicked map never shows
  // a street name that could be mistaken for the user's own.
  useEffect(() => {
    if (!isCoordinate(latitude) || !isCoordinate(longitude)) {
      setAddress(null);
      setIsResolvingAddress(false);
      return;
    }

    const controller = new AbortController();
    setIsResolvingAddress(true);
    const timer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=${latitude}&lon=${longitude}`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('reverse failed');
        const data = (await res.json()) as { display_name?: string };
        setAddress(data.display_name ?? null);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setAddress(null);
      } finally {
        setIsResolvingAddress(false);
      }
    }, 600);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [latitude, longitude]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keep the active result in view when navigating with arrows
  useEffect(() => {
    if (activeIndex < 0 || !resultsListRef.current) return;
    const node = resultsListRef.current.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleSelectResult = (result: NominatimResult) => {
    onCoordinatesChange(round(Number(result.lat)), round(Number(result.lon)));
    setQuery(result.display_name);
    setShowResults(false);
    setActiveIndex(-1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        e.preventDefault();
        setShowResults(true);
        setActiveIndex(0);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      const target = results[activeIndex];
      if (target) {
        e.preventDefault();
        handleSelectResult(target);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setActiveIndex(-1);
    }
  };

  const handleMarkerDragEnd = (e: L.DragEndEvent) => {
    const pos = (e.target as L.Marker).getLatLng();
    onCoordinatesChange(round(pos.lat), round(pos.lng));
  };

  /**
   * Arrow keys nudge the focused pin. Click and drag were the only two ways to
   * move it, which left keyboard users with no way to fine-tune a spot — the
   * search box could jump to an address but not adjust one. Shift moves ten
   * times further, so crossing a city doesn't take a hundred presses.
   */
  const handleMarkerKeyDown = (e: L.LeafletKeyboardEvent) => {
    if (!isCoordinate(latitude) || !isCoordinate(longitude)) return;
    const key = (e.originalEvent as KeyboardEvent).key;
    const step = (e.originalEvent as KeyboardEvent).shiftKey ? 0.005 : 0.0005;
    const move: Record<string, [number, number]> = {
      ArrowUp: [step, 0],
      ArrowDown: [-step, 0],
      ArrowLeft: [0, -step],
      ArrowRight: [0, step],
    };
    const delta = move[key];
    if (!delta) return;
    e.originalEvent.preventDefault();
    e.originalEvent.stopPropagation();
    onCoordinatesChange(round(latitude + delta[0]), round(longitude + delta[1]));
  };

  const addressRowLabel = !hasPin
    ? 'Nothing picked yet — search, tap the map, or use Detect'
    : isResolvingAddress
      ? 'Resolving…'
      : address
        ? address
        : 'No address found — try another spot';

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search address or place…"
          // `role="combobox"` is what ties this input to the listbox below it.
          // Without it the aria-expanded/activedescendant attributes had nothing
          // to attach to, so the relationship was never exposed and search — the
          // only keyboard route to setting the pin — announced as a plain box.
          role="combobox"
          // Only reference the listbox while it is actually rendered. Pointing
          // `aria-controls` at an id that is not in the document — which was the
          // case whenever the dropdown was closed, i.e. most of the time — is an
          // invalid reference, not a harmless one.
          aria-controls={showResults && results.length > 0 ? listboxId : undefined}
          aria-autocomplete="list"
          aria-expanded={showResults && results.length > 0}
          aria-activedescendant={
            activeIndex >= 0 ? `loc-result-${results[activeIndex]?.place_id}` : undefined
          }
          className={`w-full rounded-xl border border-sand bg-surface px-3.5 py-[11px] pr-9 text-[13px] text-charcoal transition-colors placeholder:text-slate/50 focus:border-teal-ink ${FOCUS_RING}`}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 flex h-3 w-3 -translate-y-1/2 items-center justify-center text-[13px] text-slate"
        >
          {isSearching ? (
            <span
              className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-teal"
              style={{ borderTopColor: 'transparent' }}
            />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
        </span>
        {showResults && results.length > 0 && (
          <ul
            ref={resultsListRef}
            id={listboxId}
            role="listbox"
            aria-label="Address results"
            className="absolute left-0 right-0 top-full z-[1100] mt-1 max-h-56 overflow-y-auto rounded-xl border border-sand bg-surface py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          >
            {results.map((r, i) => (
              <li key={r.place_id}>
                <button
                  id={`loc-result-${r.place_id}`}
                  type="button"
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => handleSelectResult(r)}
                  className={`block w-full px-3.5 py-2.5 text-left text-[12px] text-charcoal ${FOCUS_RING} ${
                    i === activeIndex ? 'bg-canvas' : ''
                  }`}
                >
                  {r.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-sand">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={hasPin ? 13 : 11}
          scrollWheelZoom={true}
          zoomControl={false}
          style={{ height: `${height}px`, width: '100%', background: 'var(--color-canvas)' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />
          {/* `keyboard` makes Leaflet set `tabIndex=0` and `role="button"` on the
              marker element. The `alt` option cannot name it: Leaflet applies
              `alt` only when the icon is an image element, and this is a
              `divIcon` — so the pin was a focusable button announcing nothing.
              The ref names the element Leaflet actually rendered. */}
          {hasPin && (
            <Marker
              ref={(marker) => {
                marker
                  ?.getElement()
                  ?.setAttribute('aria-label', 'Your location pin. Use the arrow keys to move it.');
              }}
              position={[latitude, longitude]}
              icon={wisprIcon}
              draggable
              keyboard
              eventHandlers={{ dragend: handleMarkerDragEnd, keydown: handleMarkerKeyDown }}
            />
          )}
          <MapController latitude={latitude} longitude={longitude} />
          <MapClickHandler onPick={onCoordinatesChange} />
          <MapReady onReady={setMapInstance} />
        </MapContainer>

        <div className="absolute left-3 top-3 z-[1000] flex flex-col gap-1.5">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => mapInstance?.zoomIn()}
            className={`flex h-11 w-11 items-center justify-center rounded-full border border-sand bg-surface text-[17px] text-charcoal shadow-[0_2px_6px_rgba(0,0,0,0.08)] transition-colors hover:bg-canvas ${FOCUS_RING}`}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => mapInstance?.zoomOut()}
            className={`flex h-11 w-11 items-center justify-center rounded-full border border-sand bg-surface text-[17px] text-charcoal shadow-[0_2px_6px_rgba(0,0,0,0.08)] transition-colors hover:bg-canvas ${FOCUS_RING}`}
          >
            −
          </button>
        </div>

        <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-sand bg-surface/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate backdrop-blur">
          {hasPin ? 'Tap, drag, or arrow keys' : 'Tap to set your spot'}
        </div>
      </div>

      <div
        className={`flex items-start gap-3 rounded-xl border px-3.5 py-2.5 ${
          hasPin ? 'border-teal/40 bg-teal/5' : 'border-dashed border-sand bg-surface'
        }`}
      >
        <span
          aria-hidden
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
            hasPin ? 'bg-teal-deep text-white' : 'bg-sand text-slate'
          }`}
        >
          <MapPin className="h-3 w-3" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate">
            {!hasPin ? 'No location yet' : isResolvingAddress ? 'Resolving address' : 'Your spot'}
          </span>
          <span
            aria-live="polite"
            className={`text-[13px] leading-snug ${
              hasPin && address ? 'text-charcoal' : 'italic text-slate'
            }`}
            title={address ?? undefined}
          >
            {addressRowLabel}
          </span>
        </div>
        {isResolvingAddress && (
          <span
            aria-hidden
            className="mt-1 inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-teal"
            style={{ borderTopColor: 'transparent' }}
          />
        )}
      </div>
    </div>
  );
}
