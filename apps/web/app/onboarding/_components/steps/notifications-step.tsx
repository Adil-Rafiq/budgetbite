'use client';

import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';

const labelClass = 'text-[11px] uppercase text-ink';
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.16em',
};

export const NotificationsStep = () => {
  const { steps } = useOnboardingContext();
  const { values, actions, errors } = steps.notifications;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className={labelClass} style={labelStyle}>
          Reminder times
        </label>
        <p className="text-[13px] text-ink">
          A single nudge per meal, at the time you choose. Off until you flip them on in settings.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-lumen-dk bg-white">
        {values.slots.map((slot, i) => (
          <div
            key={slot.mealTypeId}
            className={`flex items-center justify-between gap-4 px-4 py-3 ${
              i === 0 ? '' : 'border-t border-lumen-dk'
            } ${i % 2 === 0 ? 'bg-white' : 'bg-lumen-dk/25'}`}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-fathom/10 text-[12px] text-fathom"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}
              >
                {slot.label.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-[14px] font-medium capitalize text-vast">
                {slot.label}
              </span>
            </div>
            <input
              type="time"
              value={slot.time}
              onChange={(e) => actions.updateNotificationTime(slot.mealTypeId, e.target.value)}
              className="w-[140px] rounded-[10px] border border-lumen-dk bg-white px-3.5 py-2.5 text-[14px] text-vast outline-none"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        ))}
      </div>

      {errors.notificationSlots && (
        <p className="text-[11px] text-pulse">{errors.notificationSlots}</p>
      )}

      <div className="rounded-xl border border-lumen-dk bg-lumen p-4 text-[13px] text-vast">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-fathom text-[11px] text-lumen"
          >
            ◉
          </span>
          <div>
            <div className="font-medium">You can turn these on later</div>
            <div className="mt-0.5 text-[12px] text-ink">
              We never send marketing or social pings. Only the one nudge per meal you ask for.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
