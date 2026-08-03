'use client';

import { BellOff } from 'lucide-react';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { TimePicker } from '@/components/ui/time-picker';
import { FOCUS_RING } from '@/lib/focus-ring';

export const NotificationsStep = () => {
  const { steps } = useOnboardingContext();
  const { values, actions, errors } = steps.notifications;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-[20px] border border-sand bg-surface shadow-sm">
        {values.slots.map((slot, i) => (
          <div
            key={slot.mealTypeId}
            className={`flex items-center justify-between gap-4 px-5 py-4 ${
              i === 0 ? '' : 'border-t border-sand/70'
            }`}
          >
            <div
              className={`flex items-center gap-3 transition-opacity ${
                slot.enabled ? '' : 'opacity-50'
              }`}
            >
              <span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal/15 text-sm font-bold uppercase text-teal-ink"
              >
                {slot.label.slice(0, 1)}
              </span>
              <span className="text-sm font-semibold capitalize text-charcoal">{slot.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <TimePicker
                value={slot.time}
                onChange={(next) => actions.updateNotificationTime(slot.mealTypeId, next)}
                disabled={!slot.enabled}
                size="md"
                aria-label={`${slot.label} reminder time`}
              />
              {/* 44px hit area around a 24px-tall track: the switch itself stays
                  visually light, but the tap target clears the minimum. */}
              <button
                type="button"
                onClick={() => actions.toggleNotificationEnabled(slot.mealTypeId)}
                role="switch"
                aria-checked={slot.enabled}
                aria-label={
                  slot.enabled ? `Disable ${slot.label} reminder` : `Enable ${slot.label} reminder`
                }
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${FOCUS_RING}`}
              >
                <span
                  aria-hidden
                  className={`relative block h-6 w-11 rounded-full transition-colors ${
                    slot.enabled ? 'bg-teal-deep' : 'bg-sand'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-surface shadow-sm transition-all ${
                      slot.enabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {errors.notificationSlots && (
        <p role="alert" className="text-xs font-medium text-tomato-ink">
          {errors.notificationSlots}
        </p>
      )}

      <div className="flex items-start gap-3 rounded-[20px] border border-sand bg-surface p-5 shadow-sm">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sand/60"
        >
          <BellOff className="h-4 w-4 text-teal-ink" />
        </span>
        <p className="text-xs leading-relaxed text-slate">
          These are already set to sensible times — you only need to touch the ones you want to
          move. Reminders aren&apos;t sending yet; we save your times so they&apos;re ready when
          they do.
        </p>
      </div>
    </div>
  );
};
