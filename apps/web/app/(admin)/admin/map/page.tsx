'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, TriangleAlert, X } from 'lucide-react';

import { useAdminMap } from '@/hooks/use-admin-map';
import { DensityLegend } from '@/components/map/density-layer';
import { DataError } from '@/components/data-error';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FOCUS_RING, FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';
import {
  MAP_FILTERS,
  findStackedIds,
  isMapFilterId,
  staleCutoff,
  type MapFilterContext,
  type MapFilterId,
} from './_components/filters';
import { PinDetail } from './_components/pin-detail';
import { PinList } from './_components/pin-list';
import type { MapView } from './_components/coverage-map';

/**
 * Leaflet reads `window` at import time, so the map cannot be part of the
 * server bundle. The skeleton matches the map's own footprint rather than being
 * a spinner in an empty box — a shape that settles is a shorter-feeling wait
 * than a shape that appears.
 */
const CoverageMap = dynamic(() => import('./_components/coverage-map').then((m) => m.CoverageMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-2xl border border-sand bg-surface" />
  ),
});

const TONE_CHIP: Record<'neutral' | 'warn' | 'blocking', string> = {
  neutral: 'border-teal-ink bg-teal-tint text-teal-ink',
  warn: 'border-amber/50 bg-amber-tint text-amber-ink',
  blocking: 'border-tomato/50 bg-tomato/[0.08] text-tomato-ink',
};

/** Reads the camera and the question out of the URL, once, on mount. */
function readInitialState() {
  if (typeof window === 'undefined') {
    return { view: null as MapView | null, filter: 'all' as MapFilterId, selected: null };
  }
  const params = new URLSearchParams(window.location.search);
  const lat = Number(params.get('lat'));
  const lng = Number(params.get('lng'));
  const zoom = Number(params.get('z'));
  const filter = params.get('filter');
  return {
    view:
      Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(zoom) && params.has('lat')
        ? { lat, lng, zoom }
        : null,
    filter: isMapFilterId(filter) ? filter : ('all' as MapFilterId),
    selected: params.get('sel'),
  };
}

export default function AdminMapPage() {
  const { data, isLoading, isError, refetch } = useAdminMap();

  const [initial] = useState(readInitialState);
  const [filter, setFilter] = useState<MapFilterId>(initial.filter);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showDensity, setShowDensity] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(initial.selected);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState('');
  /**
   * A group of restaurants sharing one coordinate, opened from the map.
   *
   * The panel normally lists what is in view; while this is set it lists the
   * stack instead, because "what is in view" is the wrong answer to a click on
   * a bubble that nineteen records are hiding behind.
   */
  const [stackIds, setStackIds] = useState<string[] | null>(null);

  const viewRef = useRef<MapView | null>(initial.view);
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const staleBefore = useMemo(() => staleCutoff(data?.staleDays ?? 30), [data?.staleDays]);

  const allPins = useMemo(() => data?.restaurants ?? [], [data?.restaurants]);

  const stackedIds = useMemo(() => findStackedIds(allPins), [allPins]);
  const filterContext = useMemo<MapFilterContext>(
    () => ({ staleBefore, stackedIds }),
    [staleBefore, stackedIds],
  );

  /** Chip counts describe the whole catalogue, so they do not move as you filter. */
  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const f of MAP_FILTERS) {
      out[f.id] = allPins.filter((p) => f.matches(p, filterContext)).length;
    }
    return out;
  }, [allPins, filterContext]);

  const pins = useMemo(() => {
    const active = MAP_FILTERS.find((f) => f.id === filter) ?? MAP_FILTERS[0];
    return allPins.filter(
      (p) =>
        active?.matches(p, filterContext) &&
        (debouncedSearch === '' || p.name.toLowerCase().includes(debouncedSearch)),
    );
  }, [allPins, filter, debouncedSearch, filterContext]);

  const outliers = useMemo(() => allPins.filter((p) => p.isOutlier), [allPins]);

  const visiblePins = useMemo(() => {
    const inView = new Set(visibleIds);
    return pins.filter((p) => inView.has(p.id));
  }, [pins, visibleIds]);

  /** What the panel is listing: an opened stack, else whatever is on screen. */
  const stackPins = useMemo(() => {
    if (!stackIds) return null;
    const wanted = new Set(stackIds);
    return allPins.filter((p) => wanted.has(p.id));
  }, [stackIds, allPins]);

  const panelPins = stackPins ?? visiblePins;

  const selectedPin = useMemo(
    () => allPins.find((p) => p.id === selectedId) ?? null,
    [allPins, selectedId],
  );

  /**
   * Mirrors the view, the filter and the selection into the address bar with
   * `replaceState` rather than the router.
   *
   * A `router.replace` on every settled pan re-renders the route — and the map
   * with it — for a change no React state depends on. The camera is ephemeral;
   * it is in the URL so a coverage gap can be pasted into a message, not so the
   * framework can react to it.
   */
  const syncUrl = useCallback(
    (next: { filter?: MapFilterId; selected?: string | null; view?: MapView | null }) => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const view = next.view ?? viewRef.current;
      const activeFilter = next.filter ?? filter;
      const selection = next.selected !== undefined ? next.selected : selectedId;

      if (view) {
        params.set('lat', view.lat.toFixed(5));
        params.set('lng', view.lng.toFixed(5));
        params.set('z', String(Math.round(view.zoom)));
      }
      if (activeFilter === 'all') params.delete('filter');
      else params.set('filter', activeFilter);
      if (selection) params.set('sel', selection);
      else params.delete('sel');

      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    },
    [filter, selectedId],
  );

  const handleViewportChange = useCallback(
    (ids: string[], view: MapView) => {
      viewRef.current = view;
      setVisibleIds(ids);
      syncUrl({ view });

      // Debounced, and only the count. Announcing per frame of a drag would
      // read a new number into the user's ear a dozen times a second; naming
      // every restaurant would read a phone book.
      if (announceTimer.current) clearTimeout(announceTimer.current);
      announceTimer.current = setTimeout(() => {
        setAnnouncement(`${ids.length} of ${allPins.length} restaurants in view`);
      }, 600);
    },
    [allPins.length, syncUrl],
  );

  useEffect(() => () => void (announceTimer.current && clearTimeout(announceTimer.current)), []);

  const handleSelect = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      syncUrl({ selected: id });
    },
    [syncUrl],
  );

  const handleFilter = useCallback(
    (id: MapFilterId) => {
      setFilter(id);
      // The stack was opened from the previous set of pins; asking a new
      // question about the catalogue retires the old answer.
      setStackIds(null);
      syncUrl({ filter: id });
    },
    [syncUrl],
  );

  // Opening the group deliberately does not select one of them: nineteen
  // equally plausible records is the situation where guessing is worst.
  const handleOpenStack = useCallback((ids: string[]) => setStackIds(ids), []);

  // Changing the search re-asks the question too.
  useEffect(() => {
    setStackIds(null);
  }, [debouncedSearch]);

  // Escape backs out one layer at a time — the selected pin first, then the
  // opened stack — so it never throws away more context than the reader meant.
  useEffect(() => {
    if (!selectedId && !stackIds) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selectedId) handleSelect(null);
      else setStackIds(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, stackIds, handleSelect]);

  const activeFilter = MAP_FILTERS.find((f) => f.id === filter);

  const emptyMessage =
    pins.length === 0
      ? debouncedSearch
        ? `No restaurant matches “${search.trim()}”.`
        : filter === 'all'
          ? 'The catalogue is empty. Run the scraper to populate it.'
          : `Nothing matches ${activeFilter?.label.toLowerCase()} — that defect is clear.`
      : 'Nothing in view. Zoom out or pan to find the pins.';

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col">
      <header>
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-charcoal">
          Coverage
        </h1>
        <p className="mt-1 text-[14px] text-slate">
          Where the catalogue is, where the users are, and which coordinates cannot be right.
        </p>
      </header>

      {isError ? (
        <div className="mt-6">
          <DataError message="Could not load the coverage map." onRetry={() => refetch()} />
        </div>
      ) : isLoading ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="h-[68vh] animate-pulse rounded-2xl border border-sand bg-surface" />
          <div className="hidden h-[68vh] animate-pulse rounded-2xl border border-sand bg-surface lg:block" />
        </div>
      ) : (
        <>
          {outliers.length > 0 && filter !== 'outlier' && (
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-tomato/40 bg-tomato/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-tomato-ink" />
                <p className="text-[13px] leading-relaxed text-charcoal">
                  <span className="font-semibold text-tomato-ink">
                    {outliers.length}{' '}
                    {outliers.length === 1 ? 'restaurant sits' : 'restaurants sit'} nowhere near the
                    rest.
                  </span>{' '}
                  A coordinate this far out puts the place outside everyone&rsquo;s delivery radius,
                  and a table of numbers cannot show it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleFilter('outlier');
                  handleSelect(outliers[0]?.id ?? null);
                }}
                className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-tomato/40 bg-surface px-4 text-[13px] font-medium text-tomato-ink transition-colors hover:bg-canvas ${FOCUS_RING_ON_CANVAS}`}
              >
                Show me
              </button>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter restaurants">
              {MAP_FILTERS.map((f) => {
                const active = f.id === filter;
                const count = counts[f.id] ?? 0;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={active}
                    title={f.consequence}
                    disabled={count === 0 && f.id !== 'all'}
                    onClick={() => handleFilter(f.id)}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-9 ${FOCUS_RING_ON_CANVAS} ${
                      active
                        ? TONE_CHIP[f.tone]
                        : 'border-sand bg-surface text-slate hover:text-charcoal'
                    }`}
                  >
                    {f.label}
                    <span className="font-mono text-[11px] tabular-nums opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 lg:w-56 lg:flex-none">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search restaurants by name"
                  placeholder="Search name…"
                  className="bg-surface pl-9 pr-9"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                    className={`absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate transition-colors hover:text-charcoal ${FOCUS_RING}`}
                  >
                    <X aria-hidden className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Switch id="density" checked={showDensity} onCheckedChange={setShowDensity} />
                <Label htmlFor="density" className="text-[12.5px] text-slate">
                  User density
                </Label>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
            <div className="h-[52vh] min-h-[360px] lg:h-[68vh]">
              <CoverageMap
                pins={pins}
                cells={data?.userCells ?? []}
                cellDegrees={data?.cellDegrees ?? 0.02}
                showDensity={showDensity}
                selectedId={selectedId}
                onSelect={handleSelect}
                onOpenStack={handleOpenStack}
                onViewportChange={handleViewportChange}
                initialView={initial.view}
              />
            </div>

            <div className="flex flex-col gap-4 lg:h-[68vh]">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-sand bg-surface">
                {selectedPin && (
                  <PinDetail
                    pin={selectedPin}
                    staleBefore={staleBefore}
                    onClose={() => handleSelect(null)}
                  />
                )}
                {stackPins ? (
                  <div className="border-b border-sand bg-tomato/[0.06] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-tomato-ink">
                        one coordinate
                      </span>
                      <button
                        type="button"
                        onClick={() => setStackIds(null)}
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate transition-colors hover:text-charcoal ${FOCUS_RING}`}
                      >
                        back to view
                      </button>
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-charcoal">
                      <span className="font-semibold">
                        {stackPins.length} restaurants share this exact point.
                      </span>{' '}
                      No zoom level can draw them apart, so the map shows them as one bubble. Real
                      addresses do not agree to seven decimal places — these need their coordinates
                      corrected or the duplicates removed.
                    </p>
                    {stackPins[0] && (
                      <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-muted">
                        {stackPins[0].latitude.toFixed(6)}, {stackPins[0].longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 border-b border-sand px-3 py-2.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-muted">
                      in view
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-slate-muted">
                      {visiblePins.length} of {pins.length}
                    </span>
                  </div>
                )}
                <PinList
                  pins={panelPins}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  staleBefore={staleBefore}
                  emptyMessage={emptyMessage}
                />
              </div>

              {showDensity && data && (
                <DensityLegend
                  cells={data.userCells}
                  cellDegrees={data.cellDegrees}
                  minCellCount={data.minCellCount}
                  suppressed={data.usersInSuppressedCells}
                />
              )}
            </div>
          </div>

          {/* Scale, quietly — the same treatment the Overview gives its totals.
              Every figure here is a count; none of them locates a person. */}
          <p className="mt-4 font-mono text-[12px] tabular-nums text-slate-muted">
            {data
              ? [
                  `${data.restaurantsTotal} restaurants`,
                  outliers.length > 0 ? `${outliers.length} off-map` : null,
                  `${data.userTotal} users`,
                  data.usersInSuppressedCells > 0
                    ? `${data.usersInSuppressedCells} in sparse squares`
                    : null,
                  data.usersWithoutLocation > 0
                    ? `${data.usersWithoutLocation} with no location`
                    : null,
                  data.truncated ? 'showing the first 5000' : null,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : '—'}
          </p>

          <p role="status" aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </>
      )}
    </div>
  );
}
