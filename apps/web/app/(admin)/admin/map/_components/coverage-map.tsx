'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import { useReducedMotion } from 'motion/react';
import type { AdminMapPin, UserDensityCell } from '@repo/shared';

import { DensityLayer } from '@/components/map/density-layer';
import { clusterIcon, outlierIcon, restaurantIcon } from '@/components/map/icons';
import { MapCanvas, moveMapTo } from '@/components/map/map-canvas';
import { useClusters } from '@/components/map/use-clusters';

/** The camera, as the URL stores it. */
export interface MapView {
  lat: number;
  lng: number;
  zoom: number;
}

interface CoverageMapProps {
  pins: AdminMapPin[];
  cells: readonly UserDensityCell[];
  cellDegrees: number;
  showDensity: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** A group sharing one coordinate, handed to the panel because zoom cannot open it. */
  onOpenStack: (ids: string[]) => void;
  /** Fires on settle with the ids currently on screen, for the list and the count. */
  onViewportChange: (visibleIds: string[], view: MapView) => void;
  /** Restored from the URL. When absent the map fits itself to the catalogue. */
  initialView: MapView | null;
}

/**
 * Reports what is on screen once the map settles.
 *
 * The panel beside the map is not a second list of everything — it is the list
 * of what the operator is currently looking at, which is what makes panning a
 * query rather than just a camera move.
 */
function ViewportReporter({
  pins,
  onChange,
}: {
  pins: AdminMapPin[];
  onChange: (ids: string[], view: MapView) => void;
}) {
  const map = useMap();

  const report = () => {
    const bounds = map.getBounds();
    const center = map.getCenter();
    onChange(
      pins.filter((p) => bounds.contains([p.latitude, p.longitude])).map((p) => p.id),
      { lat: center.lat, lng: center.lng, zoom: map.getZoom() },
    );
  };

  useMapEvents({ moveend: report, zoomend: report });

  // Also on mount and whenever the filtered set changes underneath a still map,
  // which no Leaflet event covers.
  useEffect(() => {
    report();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, map]);

  return null;
}

/**
 * Opens on the data rather than on a hardcoded city.
 *
 * Runs once. Re-fitting whenever the filter changes would yank the view out
 * from under an operator who had deliberately zoomed somewhere — the filter is
 * a question about the pins, not a request to go somewhere else.
 */
function InitialView({ pins, view }: { pins: AdminMapPin[]; view: MapView | null }) {
  const map = useMap();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;

    if (view) {
      applied.current = true;
      map.setView([view.lat, view.lng], view.zoom, { animate: false });
      return;
    }
    if (pins.length === 0) return;

    applied.current = true;
    // Outliers are excluded from the fit. Including one at (0, 0) zooms the map
    // out until the whole Atlantic is on screen and the actual catalogue is a
    // single unreadable speck — the defect would hide the data it broke.
    const real = pins.filter((p) => !p.isOutlier);
    const source = real.length > 0 ? real : pins;
    if (source.length === 1) {
      const only = source[0] as AdminMapPin;
      map.setView([only.latitude, only.longitude], 13, { animate: false });
      return;
    }
    map.fitBounds(
      source.map((p) => [p.latitude, p.longitude] as [number, number]),
      { padding: [48, 48], animate: false },
    );
  }, [map, pins, view]);

  return null;
}

/** Brings a pin selected from the list into view. */
function SelectionFocus({ pin }: { pin: AdminMapPin | null }) {
  const map = useMap();
  const reduceMotion = useReducedMotion() ?? false;
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    if (!pin || pin.id === lastId.current) {
      lastId.current = pin?.id ?? null;
      return;
    }
    lastId.current = pin.id;
    // Never zoom out to reach it: an operator who has zoomed in did so on
    // purpose, and a selection should not undo that.
    moveMapTo(map, [pin.latitude, pin.longitude], Math.max(map.getZoom(), 14), reduceMotion);
  }, [map, pin, reduceMotion]);

  return null;
}

function Markers({
  pins,
  selectedId,
  onSelect,
  onOpenStack,
}: {
  pins: AdminMapPin[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpenStack: (ids: string[]) => void;
}) {
  const map = useMap();
  const reduceMotion = useReducedMotion() ?? false;
  const { nodes, expansionZoom } = useClusters(pins);

  return (
    <>
      {nodes.map((node) => {
        if (node.kind === 'cluster') {
          const hasOutlier = node.items.some((item) => item.isOutlier);
          return (
            <Marker
              key={`cluster-${node.id}`}
              position={[node.latitude, node.longitude]}
              icon={clusterIcon(node.count, { hasOutlier, isStack: node.isStack })}
              // The list beside the map is the keyboard path; 300 focusable
              // markers would be 300 tab stops between the filters and the
              // footer. Leaflet makes markers focusable by default.
              keyboard={false}
              eventHandlers={{
                click: () => {
                  // Zooming at a stack is a promise the map cannot keep: its
                  // members are at one point, so every zoom level draws the
                  // same bubble. Hand the group to the panel instead, which is
                  // where the operator can actually act on nineteen records.
                  if (node.isStack) {
                    onOpenStack(node.items.map((item) => item.id));
                    return;
                  }
                  moveMapTo(
                    map,
                    [node.latitude, node.longitude],
                    expansionZoom(node.id, map.getZoom() + 2),
                    reduceMotion,
                  );
                },
              }}
              ref={(marker) => marker?.getElement()?.setAttribute('aria-hidden', 'true')}
            />
          );
        }

        const pin = node.item;
        const selected = pin.id === selectedId;
        return (
          <Marker
            key={pin.id}
            position={[node.latitude, node.longitude]}
            icon={pin.isOutlier ? outlierIcon({ selected }) : restaurantIcon({ selected })}
            zIndexOffset={selected ? 1000 : pin.isOutlier ? 500 : 0}
            keyboard={false}
            eventHandlers={{ click: () => onSelect(selected ? null : pin.id) }}
            ref={(marker) => marker?.getElement()?.setAttribute('aria-hidden', 'true')}
          />
        );
      })}
    </>
  );
}

export function CoverageMap({
  pins,
  cells,
  cellDegrees,
  showDensity,
  selectedId,
  onSelect,
  onOpenStack,
  onViewportChange,
  initialView,
}: CoverageMapProps) {
  const selectedPin = useMemo(
    () => pins.find((p) => p.id === selectedId) ?? null,
    [pins, selectedId],
  );

  return (
    <MapCanvas
      label="Restaurant coverage and user density"
      // The map is the page here, and there is nothing behind it worth
      // scrolling to, so the wheel belongs to it.
      wheel="eager"
      className="h-full w-full rounded-2xl border border-sand"
    >
      {showDensity && <DensityLayer cells={cells} cellDegrees={cellDegrees} />}
      <Markers pins={pins} selectedId={selectedId} onSelect={onSelect} onOpenStack={onOpenStack} />
      <InitialView pins={pins} view={initialView} />
      <SelectionFocus pin={selectedPin} />
      <ViewportReporter pins={pins} onChange={onViewportChange} />
    </MapCanvas>
  );
}
