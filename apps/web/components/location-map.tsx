'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

const LEAFLET_ICON_BASE = 'https://unpkg.com/leaflet@1.9.4/dist/images/';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: `${LEAFLET_ICON_BASE}marker-icon-2x.png`,
  iconUrl: `${LEAFLET_ICON_BASE}marker-icon.png`,
  shadowUrl: `${LEAFLET_ICON_BASE}marker-shadow.png`,
});

const wisprIcon = L.divIcon({
  className: 'wispr-pin',
  html: `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0z" fill="#e84c3d"/>
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

interface LocationMapProps {
  latitude: number;
  longitude: number;
  onCoordinatesChange: (latitude: number, longitude: number) => void;
  height?: number;
}

function MapController({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  const lastApplied = useRef({ lat: latitude, lng: longitude });

  useEffect(() => {
    const last = lastApplied.current;
    if (Math.abs(last.lat - latitude) < 1e-6 && Math.abs(last.lng - longitude) < 1e-6) return;
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
  height = 280,
}: LocationMapProps) {
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

  // Reverse geocode (debounced) — resolves the picked spot to an address
  useEffect(() => {
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

  const addressRowLabel = isResolvingAddress
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
          aria-autocomplete="list"
          aria-expanded={showResults && results.length > 0}
          aria-activedescendant={
            activeIndex >= 0 ? `loc-result-${results[activeIndex]?.place_id}` : undefined
          }
          className="w-full rounded-xl border border-sage bg-white px-3.5 py-[11px] pr-9 text-[13px] text-charcoal outline-none transition-colors placeholder:text-slate/50 focus:border-green"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 flex h-3 w-3 -translate-y-1/2 items-center justify-center text-[13px] text-slate"
        >
          {isSearching ? (
            <span
              className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-green"
              style={{ borderTopColor: 'transparent' }}
            />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
        </span>
        {showResults && results.length > 0 && (
          <ul
            ref={resultsListRef}
            role="listbox"
            className="absolute left-0 right-0 top-full z-[1100] mt-1 max-h-56 overflow-y-auto rounded-xl border border-sage bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
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
                  className={`block w-full px-3.5 py-2 text-left text-[12px] text-charcoal ${
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

      <div className="relative overflow-hidden rounded-2xl border border-sage">
        <MapContainer
          center={[latitude, longitude]}
          zoom={13}
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
          <Marker
            position={[latitude, longitude]}
            icon={wisprIcon}
            draggable
            eventHandlers={{ dragend: handleMarkerDragEnd }}
          />
          <MapController latitude={latitude} longitude={longitude} />
          <MapClickHandler onPick={onCoordinatesChange} />
          <MapReady onReady={setMapInstance} />
        </MapContainer>

        <div className="absolute left-3 top-3 z-[1000] flex flex-col gap-1.5">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => mapInstance?.zoomIn()}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-sage bg-white text-[15px] text-charcoal shadow-[0_2px_6px_rgba(0,0,0,0.08)] transition-colors hover:bg-canvas"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => mapInstance?.zoomOut()}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-sage bg-white text-[15px] text-charcoal shadow-[0_2px_6px_rgba(0,0,0,0.08)] transition-colors hover:bg-canvas"
          >
            −
          </button>
        </div>

        <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-sage bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate backdrop-blur">
          Tap or drag pin
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-sage bg-white px-3.5 py-2.5">
        <span
          aria-hidden
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tomato text-white"
        >
          <MapPin className="h-3 w-3" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate">
            {isResolvingAddress ? 'Resolving address' : 'Pinned location'}
          </span>
          <span
            className={`text-[13px] leading-snug ${address ? 'text-charcoal' : 'italic text-slate'}`}
            title={address ?? undefined}
          >
            {addressRowLabel}
          </span>
        </div>
        {isResolvingAddress && (
          <span
            aria-hidden
            className="mt-1 inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-green"
            style={{ borderTopColor: 'transparent' }}
          />
        )}
      </div>
    </div>
  );
}
