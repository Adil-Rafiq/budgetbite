'use client';

import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { Pill } from '@/components/ui/pill';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const WHITE = '#ffffff';
const MUTED = '#71716a';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: WHITE,
  border: `1px solid ${LUMEN_DK}`,
  borderRadius: 10,
  padding: '11px 14px',
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  color: VAST,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.16em',
  color: MUTED,
  fontSize: 11,
  textTransform: 'uppercase',
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
              className="inline-block h-3 w-3 animate-spin rounded-full border-2"
              style={{ borderColor: LUMEN, borderTopColor: 'transparent' }}
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
        className="flex items-center gap-3 rounded-md px-3 py-1.5 text-[11px]"
        style={{
          fontFamily: 'var(--font-mono)',
          background: 'transparent',
          color: MUTED,
        }}
      >
        <div className="h-px flex-1" style={{ background: LUMEN_DK }} />
        <span>or enter coordinates manually</span>
        <div className="h-px flex-1" style={{ background: LUMEN_DK }} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="latitude" style={labelStyle}>Latitude</label>
          <input
            id="latitude"
            type="number"
            step="0.0001"
            placeholder="24.8607"
            disabled={state.isDetectingLocation}
            value={values.latitude ?? ''}
            onChange={(event) => actions.setLatitude(Number(event.target.value))}
            style={inputStyle}
          />
          {errors.latitude && (
            <p className="text-[11px]" style={{ color: PULSE }}>
              {errors.latitude}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="longitude" style={labelStyle}>Longitude</label>
          <input
            id="longitude"
            type="number"
            step="0.0001"
            placeholder="67.0011"
            disabled={state.isDetectingLocation}
            value={values.longitude ?? ''}
            onChange={(event) => actions.setLongitude(Number(event.target.value))}
            style={inputStyle}
          />
          {errors.longitude && (
            <p className="text-[11px]" style={{ color: PULSE }}>
              {errors.longitude}
            </p>
          )}
        </div>
      </div>

      <div
        className="rounded-xl border p-4 text-[13px]"
        style={{ borderColor: LUMEN_DK, background: LUMEN, color: VAST }}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
            style={{ background: FATHOM, color: LUMEN }}
          >
            ⛯
          </span>
          <div>
            <div style={{ fontWeight: 500 }}>Default: Karachi, Pakistan</div>
            <div className="mt-0.5 text-[12px]" style={{ color: MUTED }}>
              We use this to find restaurants within 5 km. You can change it later in settings.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
