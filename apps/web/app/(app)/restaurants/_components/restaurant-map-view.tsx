'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Marker, Popup, useMap } from 'react-leaflet';
import { useReducedMotion } from 'motion/react';
import { Star } from 'lucide-react';
import type { BudgetFit, RestaurantMapPin } from '@repo/shared';
import { classifyBudgetFit, typicalMealCost } from '@repo/shared';

import { BudgetFitBadge } from '@/components/budget-fit-badge';
import { clusterIcon, homeIcon, restaurantIcon } from '@/components/map/icons';
import { MapCanvas, moveMapTo } from '@/components/map/map-canvas';
import { useClusters } from '@/components/map/use-clusters';
import { formatPKR } from '@/lib/currency';
import { FOCUS_RING } from '@/lib/focus-ring';
import { humanizeName } from '@/lib/humanize-name';

/**
 * The restaurants list, as a place.
 *
 * The list already answers "what can I afford"; it cannot answer "what is
 * actually around me", which is the question the distance slider has been
 * asking on the reader's behalf without ever showing them the shape of the
 * answer. The radius ring is the point of this view: 5 km stops being a number
 * and becomes an area with restaurants inside it.
 */

interface RestaurantMapViewProps {
  pins: RestaurantMapPin[];
  origin: { latitude: number; longitude: number } | null;
  /** The distance filter in force, drawn as a ring. Null when unset or unusable. */
  radiusKm: number | null;
  avgPerMeal: number;
  amountRemaining: number;
  hasActivePlan: boolean;
}

/** Keeps the whole result set in frame as the filters change it. */
function FitToPins({
  pins,
  origin,
  radiusKm,
}: {
  pins: RestaurantMapPin[];
  origin: { latitude: number; longitude: number } | null;
  radiusKm: number | null;
}) {
  const map = useMap();
  const reduceMotion = useReducedMotion() ?? false;
  // A signature rather than the array: the query returns a fresh array on every
  // refetch, and refitting on identical data would yank a reader who had panned.
  const signature = pins
    .map((p) => p.id)
    .sort()
    .join(',');
  const lastSignature = useRef<string | null>(null);

  useEffect(() => {
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;

    if (pins.length === 0) {
      if (origin) moveMapTo(map, [origin.latitude, origin.longitude], 12, reduceMotion);
      return;
    }

    const points: [number, number][] = pins.map((p) => [p.latitude, p.longitude]);
    // The ring is part of the answer, so it has to fit too — otherwise the one
    // element that explains the filter is the one cropped off the edge.
    if (origin && radiusKm) {
      const dLat = radiusKm / 111;
      const dLng = radiusKm / (111 * Math.cos((origin.latitude * Math.PI) / 180));
      points.push([origin.latitude - dLat, origin.longitude - dLng]);
      points.push([origin.latitude + dLat, origin.longitude + dLng]);
    } else if (origin) {
      points.push([origin.latitude, origin.longitude]);
    }

    if (points.length === 1) {
      const only = points[0] as [number, number];
      map.setView(only, 14, { animate: false });
      return;
    }
    map.fitBounds(points, { padding: [40, 40], animate: !reduceMotion });
  }, [map, pins, signature, origin, radiusKm, reduceMotion]);

  return null;
}

function PinPopup({
  pin,
  fit,
  cost,
}: {
  pin: RestaurantMapPin;
  fit: BudgetFit | null;
  cost: number | null;
}) {
  return (
    <div className="flex min-w-[180px] flex-col gap-1.5">
      <p className="font-display text-[14px] font-semibold leading-snug tracking-tight text-charcoal">
        {humanizeName(pin.name)}
      </p>

      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] tabular-nums text-slate">
        {pin.rating != null && (
          <span className="flex items-center gap-1">
            <Star aria-hidden className="h-3 w-3 fill-amber text-amber" />
            {pin.rating.toFixed(1)}
          </span>
        )}
        {pin.distanceKm != null && <span>{pin.distanceKm.toFixed(1)} km</span>}
      </div>

      {cost != null ? (
        <div className="flex items-end justify-between gap-2 pt-0.5">
          <span className="flex flex-col">
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-slate">
              Typical meal
            </span>
            <span className="font-display text-[16px] font-semibold tabular-nums leading-none text-charcoal">
              {formatPKR(cost)}
            </span>
          </span>
          {fit && <BudgetFitBadge fit={fit} showDot />}
        </div>
      ) : (
        <span className="text-[11.5px] text-slate">no menu yet</span>
      )}

      <Link
        href={`/restaurants/${pin.id}`}
        className={`mt-1 inline-flex min-h-9 items-center justify-center rounded-lg bg-teal-deep px-3 text-[12px] font-semibold text-white transition-colors hover:bg-teal-deeper ${FOCUS_RING}`}
      >
        View restaurant
      </Link>
    </div>
  );
}

/**
 * Several restaurants at one point.
 *
 * Rendered as a scrollable list rather than a "zoom in for more" hint, because
 * there is no zoom level that separates them — they are at the same
 * coordinate. Sorted by name so the order is stable between openings.
 */
function StackPopup({ items }: { items: RestaurantMapPin[] }) {
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="flex w-[220px] flex-col gap-1.5">
      <p className="text-[12px] font-semibold text-charcoal">{sorted.length} restaurants here</p>
      <p className="text-[11px] leading-relaxed text-slate">
        These share one location, so they cannot be separated on the map.
      </p>
      <ul className="mt-0.5 flex max-h-48 flex-col overflow-y-auto">
        {sorted.map((pin) => (
          <li key={pin.id}>
            <Link
              href={`/restaurants/${pin.id}`}
              className={`flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-[12px] text-charcoal transition-colors hover:bg-canvas ${FOCUS_RING}`}
            >
              <span className="min-w-0 truncate">{humanizeName(pin.name)}</span>
              {pin.rating != null && (
                <span className="flex shrink-0 items-center gap-0.5 tabular-nums text-slate">
                  <Star aria-hidden className="h-2.5 w-2.5 fill-amber text-amber" />
                  {pin.rating.toFixed(1)}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PinMarkers({
  pins,
  avgPerMeal,
  amountRemaining,
  hasActivePlan,
}: {
  pins: RestaurantMapPin[];
  avgPerMeal: number;
  amountRemaining: number;
  hasActivePlan: boolean;
}) {
  const map = useMap();
  const reduceMotion = useReducedMotion() ?? false;
  const { nodes, expansionZoom } = useClusters(pins);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      {nodes.map((node) => {
        if (node.kind === 'cluster') {
          // A stack shares one coordinate, so zooming can never open it. It
          // lists its members in a popup instead — otherwise a food court's
          // worth of restaurants hides behind one dot and the reader gets
          // whichever happened to be drawn on top.
          if (node.isStack) {
            return (
              <Marker
                key={`stack-${node.id}`}
                position={[node.latitude, node.longitude]}
                icon={clusterIcon(node.count, { isStack: true })}
                keyboard={false}
                ref={(marker) => marker?.getElement()?.setAttribute('aria-hidden', 'true')}
              >
                <Popup>
                  <StackPopup items={node.items} />
                </Popup>
              </Marker>
            );
          }
          return (
            <Marker
              key={`cluster-${node.id}`}
              position={[node.latitude, node.longitude]}
              icon={clusterIcon(node.count)}
              keyboard={false}
              eventHandlers={{
                click: () =>
                  moveMapTo(
                    map,
                    [node.latitude, node.longitude],
                    expansionZoom(node.id, map.getZoom() + 2),
                    reduceMotion,
                  ),
              }}
              ref={(marker) => marker?.getElement()?.setAttribute('aria-hidden', 'true')}
            />
          );
        }

        const pin = node.item;
        // The same two functions the cards call, on the same four numbers, so a
        // restaurant cannot read "Fits budget" in one view and "Tight" in the
        // other on the same screen.
        const cost = typicalMealCost({
          avgItemPrice: pin.avgItemPrice,
          minItemPrice: pin.minItemPrice,
          deliveryFee: pin.deliveryFee,
          minimumOrder: pin.minimumOrder,
        });
        const fit =
          hasActivePlan && cost != null && avgPerMeal > 0
            ? classifyBudgetFit({
                itemPrice: cost,
                avgBudgetPerRemainingMeal: avgPerMeal,
                amountRemaining,
              })
            : null;

        return (
          <Marker
            key={pin.id}
            position={[node.latitude, node.longitude]}
            icon={restaurantIcon({ selected: pin.id === openId })}
            zIndexOffset={pin.id === openId ? 1000 : 0}
            // The list is the keyboard route to every one of these; markers as
            // tab stops would put one per restaurant between the toggle and the
            // rest of the page.
            keyboard={false}
            eventHandlers={{
              popupopen: () => setOpenId(pin.id),
              popupclose: () => setOpenId(null),
            }}
            ref={(marker) => marker?.getElement()?.setAttribute('aria-hidden', 'true')}
          >
            <Popup>
              <PinPopup pin={pin} fit={fit} cost={cost} />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export function RestaurantMapView({
  pins,
  origin,
  radiusKm,
  avgPerMeal,
  amountRemaining,
  hasActivePlan,
}: RestaurantMapViewProps) {
  const center = useMemo<[number, number] | undefined>(
    () => (origin ? [origin.latitude, origin.longitude] : undefined),
    [origin],
  );

  return (
    <MapCanvas
      label="Restaurants near you"
      center={center}
      zoom={origin ? 13 : 11}
      className="h-full w-full rounded-2xl border border-sand"
    >
      {origin && radiusKm && (
        <Circle
          center={[origin.latitude, origin.longitude]}
          radius={radiusKm * 1000}
          interactive={false}
          // Stroke and fill are set in CSS, not here: Leaflet writes colour
          // options out as SVG presentation attributes, and `var()` does not
          // resolve in one. A literal would have been a patch of light mode
          // stranded in the dark theme.
          className="bb-radius-ring"
          pathOptions={{
            weight: 1.5,
            // Dashed, because the boundary is a filter the reader set, not a
            // fact about the world — a solid ring reads like a fence.
            dashArray: '5 6',
          }}
        />
      )}

      {origin && (
        <Marker
          position={[origin.latitude, origin.longitude]}
          icon={homeIcon()}
          keyboard={false}
          interactive={false}
          zIndexOffset={-500}
          ref={(marker) => marker?.getElement()?.setAttribute('aria-hidden', 'true')}
        />
      )}

      <PinMarkers
        pins={pins}
        avgPerMeal={avgPerMeal}
        amountRemaining={amountRemaining}
        hasActivePlan={hasActivePlan}
      />
      <FitToPins pins={pins} origin={origin} radiusKm={radiusKm} />
    </MapCanvas>
  );
}
