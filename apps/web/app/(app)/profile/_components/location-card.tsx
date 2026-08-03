'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LocateFixed, MapPin } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { NearbyProof, useNearbyCount } from '@/components/nearby-proof';
import { DEFAULT_MAP_VIEW } from '@/app/onboarding/constants';
import { Section } from '@/app/(app)/profile/_components/section';
import { SaveRow } from '@/app/(app)/profile/_components/save-row';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useDetectLocation } from '@/hooks/use-detect-location';
import { useUpdateProfile, useUser } from '@/hooks/use-user';
import { FOCUS_RING } from '@/lib/focus-ring';
import { getErrorMessage } from '@/lib/api/errors';
import { NEARBY_PROOF_RADIUS_KM } from '@/lib/nearby';
import { showToast } from '@/lib/toast';

const LocationMap = dynamic(() => import('@/components/location-map').then((m) => m.LocationMap), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-2">
      <div className="h-[46px] w-full animate-pulse rounded-xl border border-sand bg-canvas" />
      <div className="h-[280px] w-full animate-pulse rounded-2xl border border-sand bg-canvas" />
    </div>
  ),
});

type Coords = { latitude: number; longitude: number };

/**
 * Changing where you live is the highest-consequence control in the product:
 * it decides which restaurants can ever be suggested, and it can strand the
 * meals in an active plan outside the delivery radius. It used to be committed
 * by a ghost button labelled "Update location" and acknowledged by a two-word
 * toast, while onboarding gave the identical decision a full step with live
 * proof. This card is that step, at the place where the decision gets changed.
 *
 * Note what is *not* stored in state: the Karachi fallback. `DEFAULT_MAP_VIEW`
 * is passed to the map as `fallbackCenter` — a view hint — exactly as
 * `onboarding/constants.ts` documents. Writing it into the value made the map
 * drop a pin, reverse-geocode it, and label a city the user had never chosen
 * "Your spot", with the correction button disabled because the form was clean.
 */
export function LocationCard({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const { data: user } = useUser();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const { data: active } = useActiveBudgetPlan();

  const saved: Coords | null =
    typeof user?.profile?.latitude === 'number' && typeof user?.profile?.longitude === 'number'
      ? { latitude: user.profile.latitude, longitude: user.profile.longitude }
      : null;

  const [pending, setPending] = useState<Coords | null>(saved);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Adopt the saved location only while nothing is in flight, so a refetch
  // triggered by another card's save cannot overwrite a pin being moved.
  const isDirty =
    !!pending &&
    (!saved || pending.latitude !== saved.latitude || pending.longitude !== saved.longitude);

  useEffect(() => {
    if (isDirty) return;
    setPending(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved?.latitude, saved?.longitude]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const setCoordinates = (latitude: number, longitude: number) =>
    setPending({ latitude, longitude });

  const { detect, isDetecting } = useDetectLocation({ onSuccess: setCoordinates });

  const currentNearby = useNearbyCount(saved?.latitude, saved?.longitude);
  const pendingNearby = useNearbyCount(pending?.latitude, pending?.longitude);

  const [saveError, setSaveError] = useState<string | null>(null);

  const commit = async () => {
    if (!pending) return;
    setConfirmOpen(false);
    setSaveError(null);
    try {
      await updateProfile(pending);
      showToast.success({
        title: 'Location saved',
        // Only quote a count we actually have. `total` is null while the lookup
        // is settling or after it failed.
        description:
          pendingNearby.total !== null
            ? `${pendingNearby.total} restaurants now within ${NEARBY_PROOF_RADIUS_KM} km.`
            : undefined,
      });
    } catch (err) {
      // A toast is not enough on its own: it expires, and the card is left
      // reading "Unsaved" with no reason. This persists next to the button.
      const message = getErrorMessage(err);
      setSaveError(message);
      showToast.error({ title: 'Could not save location', description: message });
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    // Only worth a confirmation when there is something to lose: a location
    // already on file, or a plan whose meals were chosen around the old one.
    if (saved || active) setConfirmOpen(true);
    else commit();
  };

  // Only a real comparison when both lookups have actually settled.
  const delta =
    pendingNearby.total !== null && currentNearby.total !== null
      ? pendingNearby.total - currentNearby.total
      : null;

  return (
    <Section
      icon={MapPin}
      title="Where you order from"
      hint={`Only restaurants within ${NEARBY_PROOF_RADIUS_KM} km of this spot can be suggested.`}
      tone="planner"
      isDirty={isDirty}
    >
      <form className="flex flex-1 flex-col gap-4" onSubmit={onSubmit} noValidate>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={detect}
            disabled={isDetecting}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-sand bg-surface px-4 text-[13px] font-medium text-slate transition-colors hover:bg-canvas disabled:opacity-60 ${FOCUS_RING}`}
          >
            {isDetecting ? (
              <>
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-teal-ink"
                  style={{ borderTopColor: 'transparent' }}
                />
                Detecting…
              </>
            ) : (
              <>
                <LocateFixed aria-hidden className="h-3.5 w-3.5" />
                Use my location
              </>
            )}
          </button>
        </div>

        <LocationMap
          latitude={pending?.latitude ?? null}
          longitude={pending?.longitude ?? null}
          fallbackCenter={DEFAULT_MAP_VIEW}
          onCoordinatesChange={setCoordinates}
        />

        {pending ? (
          <NearbyProof latitude={pending.latitude} longitude={pending.longitude} />
        ) : (
          <div className="rounded-xl border border-dashed border-sand bg-canvas px-4 py-3">
            <p className="text-xs leading-relaxed text-slate">
              No location on file yet. Search, tap the map, or use Detect — we compare that spot
              against every restaurant we have and only suggest ones within{' '}
              <span className="font-semibold text-charcoal">{NEARBY_PROOF_RADIUS_KM} km</span>.
            </p>
          </div>
        )}

        {saveError && (
          <p role="alert" className="text-[12px] font-medium text-tomato-ink">
            {saveError}
          </p>
        )}

        <SaveRow
          isDirty={isDirty}
          isSubmitting={isPending}
          onRevert={() => {
            setPending(saved);
            setSaveError(null);
          }}
          savingLabel="Saving…"
        />
      </form>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="text-xs font-semibold uppercase tracking-widest text-teal-ink">
              Confirm · Location
            </div>
            <AlertDialogTitle className="font-display text-xl font-semibold tracking-tight text-charcoal">
              Move where you order from?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-2 text-slate">
                {/* Three honest states, never a number we don't have. The count
                    used to be read off a stale cache entry the moment the pin
                    moved, and a failed lookup rendered as a confident zero. */}
                <p>
                  {pendingNearby.isLoading ? (
                    'Checking what delivers to the new spot…'
                  ) : pendingNearby.total === null ? (
                    <>
                      We couldn&apos;t reach the restaurant list to check what delivers to the new
                      spot. You can still save it.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-charcoal">
                        {pendingNearby.total}{' '}
                        {pendingNearby.total === 1 ? 'restaurant delivers' : 'restaurants deliver'}
                      </span>{' '}
                      within {NEARBY_PROOF_RADIUS_KM} km of the new spot
                      {saved && currentNearby.total !== null && (
                        <> — you have {currentNearby.total} today</>
                      )}
                      .
                      {delta !== null && delta < 0 && (
                        <> That is {Math.abs(delta)} fewer places to choose from.</>
                      )}
                    </>
                  )}
                </p>
                {active && (
                  <p>
                    Your active plan&apos;s meals were picked around the old spot. Anything outside
                    the new radius stays in the plan, but we won&apos;t suggest more like it.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={`min-h-11 rounded-xl border border-sand bg-surface px-4 text-[13px] font-medium text-slate transition-colors hover:bg-canvas active:scale-[0.97] ${FOCUS_RING}`}
            >
              Keep the old spot
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={commit}
              className={`min-h-11 rounded-xl bg-teal-deep px-5 text-[13px] font-semibold text-white transition-colors hover:bg-teal-deeper active:scale-[0.97] ${FOCUS_RING}`}
            >
              Save this location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}
