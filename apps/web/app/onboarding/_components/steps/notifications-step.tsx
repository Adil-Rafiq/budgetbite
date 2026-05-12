'use client';

import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const WHITE = '#ffffff';
const MUTED = '#71716a';

const inputStyle: React.CSSProperties = {
  background: WHITE,
  border: `1px solid ${LUMEN_DK}`,
  borderRadius: 10,
  padding: '10px 14px',
  fontFamily: 'var(--font-mono)',
  fontSize: 14,
  color: VAST,
  outline: 'none',
  width: 140,
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.16em',
  color: MUTED,
  fontSize: 11,
  textTransform: 'uppercase',
};

export const NotificationsStep = () => {
  const { steps } = useOnboardingContext();
  const { values, actions, errors } = steps.notifications;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label style={labelStyle}>Reminder times</label>
        <p className="text-[13px]" style={{ color: MUTED }}>
          A single nudge per meal, at the time you choose. Off until you flip them on in settings.
        </p>
      </div>

      <div
        className="overflow-hidden rounded-xl"
        style={{ border: `1px solid ${LUMEN_DK}`, background: WHITE }}
      >
        {values.slots.map((slot, i) => (
          <div
            key={slot.mealTypeId}
            className="flex items-center justify-between gap-4 px-4 py-3"
            style={{
              borderTop: i === 0 ? 'none' : `1px solid ${LUMEN_DK}`,
              background: i % 2 === 0 ? WHITE : 'rgba(228,228,208,0.25)',
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px]"
                style={{
                  background: 'rgba(3,79,70,0.10)',
                  color: FATHOM,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}
              >
                {slot.label.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-[14px] capitalize" style={{ color: VAST, fontWeight: 500 }}>
                {slot.label}
              </span>
            </div>
            <input
              type="time"
              value={slot.time}
              onChange={(e) => actions.updateNotificationTime(slot.mealTypeId, e.target.value)}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {errors.notificationSlots && (
        <p className="text-[11px]" style={{ color: PULSE }}>
          {errors.notificationSlots}
        </p>
      )}

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
            ◉
          </span>
          <div>
            <div style={{ fontWeight: 500 }}>You can turn these on later</div>
            <div className="mt-0.5 text-[12px]" style={{ color: MUTED }}>
              We never send marketing or social pings. Only the one nudge per meal you ask for.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
