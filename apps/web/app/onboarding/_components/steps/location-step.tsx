'use client';

import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { Pill } from '@/components/ui/pill';

const inputClass =
  'w-full rounded-[10px] border border-lumen-dk bg-white px-3.5 py-[11px] text-[13px] text-vast outline-none';
const inputStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

const labelClass = 'text-[11px] uppercase text-ink';
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.16em',
};

export const LocationStep = () => {
  const { steps } = useOnboardingContext();
  const { values, actions, errors, state } = steps.location;

  return (
    <div className="flex flex-col gap-5">
      <Pill
        variant="accent"
        size="md"
        onClick={actions.detectLocation}
        disabled={state.isDetectingLocation}
      >
        {state.isDetectingLocation ? (
          <>
            <span
              className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-lumen"
              style={{ borderTopColor: 'transparent' }}
            />
            Detecting…
          </>
        ) : (
          <>
            <span style={{ fontFamily: 'var(--font-mono)' }}>◉</span>
            Use my current location
          </>
        )}
      </Pill>

      <div
        className="flex items-center gap-3 rounded-md bg-transparent px-3 py-1.5 text-[11px] text-ink"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <div className="h-px flex-1 bg-lumen-dk" />
        <span>or enter coordinates manually</span>
        <div className="h-px flex-1 bg-lumen-dk" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="latitude" className={labelClass} style={labelStyle}>
            Latitude
          </label>
          <input
            id="latitude"
            type="number"
            step="0.0001"
            placeholder="24.8607"
            disabled={state.isDetectingLocation}
            value={values.latitude ?? ''}
            onChange={(event) => actions.setLatitude(Number(event.target.value))}
            className={inputClass}
            style={inputStyle}
          />
          {errors.latitude && <p className="text-[11px] text-pulse">{errors.latitude}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="longitude" className={labelClass} style={labelStyle}>
            Longitude
          </label>
          <input
            id="longitude"
            type="number"
            step="0.0001"
            placeholder="67.0011"
            disabled={state.isDetectingLocation}
            value={values.longitude ?? ''}
            onChange={(event) => actions.setLongitude(Number(event.target.value))}
            className={inputClass}
            style={inputStyle}
          />
          {errors.longitude && <p className="text-[11px] text-pulse">{errors.longitude}</p>}
        </div>
      </div>

      <div className="rounded-xl border border-lumen-dk bg-lumen p-4 text-[13px] text-vast">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-fathom text-[11px] text-lumen"
          >
            ⛯
          </span>
          <div>
            <div className="font-medium">Default: Karachi, Pakistan</div>
            <div className="mt-0.5 text-[12px] text-ink">
              We use this to find restaurants within 5 km. You can change it later in settings.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
