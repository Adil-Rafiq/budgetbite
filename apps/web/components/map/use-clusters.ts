'use client';

import type L from 'leaflet';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import Supercluster from 'supercluster';

/**
 * Grouping pins that would otherwise land on top of each other.
 *
 * Supercluster rather than `leaflet.markercluster`: it is a headless index —
 * points in, clusters out — so every bubble on screen is our own markup, styled
 * with the same tokens as the rest of the app and following the theme. The
 * Leaflet plugin ships a stylesheet and animations of its own that would have
 * to be overridden rule by rule to stop looking like a different product.
 */

export interface ClusterablePoint {
  id: string;
  latitude: number;
  longitude: number;
}

export type ClusterNode<T> =
  | {
      kind: 'cluster';
      id: number;
      latitude: number;
      longitude: number;
      count: number;
      items: T[];
      /**
       * Every member sits on effectively one coordinate, so no amount of
       * zooming will ever separate them. Clicking this must list its members;
       * zooming at it is a promise the map cannot keep.
       */
      isStack: boolean;
    }
  | { kind: 'point'; id: string; latitude: number; longitude: number; item: T };

/**
 * How close two points have to be before the map treats them as one place:
 * ~1 m. Below that no zoom level can draw them apart, so the distinction is
 * not one the map is able to offer.
 */
const STACK_EPSILON_DEG = 1e-5;

export function isCoincident(points: readonly ClusterablePoint[]): boolean {
  if (points.length < 2) return false;
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  for (const p of points) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLng) minLng = p.longitude;
    if (p.longitude > maxLng) maxLng = p.longitude;
  }
  return maxLat - minLat < STACK_EPSILON_DEG && maxLng - minLng < STACK_EPSILON_DEG;
}

/** What the map is looking at. Recomputed only when it settles, never mid-drag. */
interface Viewport {
  bounds: [number, number, number, number];
  zoom: number;
}

const readViewport = (map: L.Map): Viewport => {
  const b = map.getBounds();
  return {
    bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
    zoom: Math.round(map.getZoom()),
  };
};

export interface UseClustersOptions {
  /**
   * Below this many points, clustering is skipped and every pin is drawn.
   * Bubbling four restaurants up into a "4" hides the map's actual answer
   * behind a number the reader then has to click to undo.
   */
  threshold?: number;
  /** Cluster radius in pixels. */
  radius?: number;
  /**
   * The deepest zoom the index still clusters at. Deliberately the map's own
   * maximum rather than something lower.
   *
   * Above this zoom supercluster stops clustering and returns raw points — and
   * points that share a coordinate then render as one marker on top of another,
   * so a stack of nineteen restaurants becomes a single dot that answers for
   * all of them. Keeping the index clustering all the way up means such a
   * group stays a labelled bubble at every zoom instead of quietly collapsing
   * into a lie.
   */
  maxZoom?: number;
}

export interface ClusterResult<T> {
  nodes: ClusterNode<T>[];
  /** The zoom at which a given cluster breaks apart — where a click should go. */
  expansionZoom: (clusterId: number, fallback: number) => number;
}

/**
 * Clusters `points` for the current view.
 *
 * Each cluster carries its leaves, so callers can answer questions about a
 * bubble — "does this one contain the broken coordinate?" — without a second
 * lookup. That is what turns a cluster from an obstacle into a summary.
 */
export function useClusters<T extends ClusterablePoint>(
  points: readonly T[],
  options: UseClustersOptions = {},
): ClusterResult<T> {
  const { threshold = 12, radius = 58, maxZoom = 20 } = options;
  const map = useMap();
  const [viewport, setViewport] = useState<Viewport | null>(null);

  // Only on settle. Recomputing per animation frame of a drag rebuilds the
  // entire marker set dozens of times a second for a picture nobody is reading
  // yet, and on a mid-range phone that is the difference between a smooth pan
  // and a stuttering one.
  useMapEvents({
    moveend: () => setViewport(readViewport(map)),
    zoomend: () => setViewport(readViewport(map)),
  });

  useEffect(() => {
    setViewport(readViewport(map));
  }, [map]);

  const index = useMemo(() => {
    if (points.length < threshold) return null;
    const supercluster = new Supercluster<{ item: T }>({ radius, maxZoom });
    supercluster.load(
      points.map((point) => ({
        type: 'Feature' as const,
        properties: { item: point },
        geometry: { type: 'Point' as const, coordinates: [point.longitude, point.latitude] },
      })),
    );
    return supercluster;
  }, [points, threshold, radius, maxZoom]);

  const nodes = useMemo<ClusterNode<T>[]>(() => {
    if (!index) {
      return points.map((item) => ({
        kind: 'point' as const,
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        item,
      }));
    }
    if (!viewport) return [];

    return index.getClusters(viewport.bounds, viewport.zoom).map((feature) => {
      const [longitude, latitude] = feature.geometry.coordinates as [number, number];
      const props = feature.properties;
      // Supercluster returns leaves and clusters from one call; `cluster` is
      // the discriminant it sets on the aggregated ones.
      if ('cluster' in props && props.cluster) {
        const clusterId = props.cluster_id;
        // `Infinity` is the whole cluster, not a page of it: a bubble that
        // reported "contains a defect" from a sample of ten would be wrong
        // exactly when it mattered.
        const items = index.getLeaves(clusterId, Infinity).map((leaf) => leaf.properties.item);
        return {
          kind: 'cluster' as const,
          id: clusterId,
          latitude,
          longitude,
          count: props.point_count,
          items,
          isStack: isCoincident(items),
        };
      }
      const item = (props as { item: T }).item;
      return { kind: 'point' as const, id: item.id, latitude, longitude, item };
    });
  }, [index, viewport, points]);

  const expansionZoom = useCallback(
    (clusterId: number, fallback: number) => {
      if (!index) return fallback;
      try {
        // Capped, so one click on a very tight group cannot slam the view to
        // maximum zoom and lose the surrounding context entirely.
        return Math.min(index.getClusterExpansionZoom(clusterId), maxZoom + 2);
      } catch {
        // The index was rebuilt between render and click, so the id is stale.
        // A zoom step is a worse answer than the right one and a much better
        // one than a thrown error inside a click handler.
        return fallback;
      }
    },
    [index, maxZoom],
  );

  return { nodes, expansionZoom };
}
