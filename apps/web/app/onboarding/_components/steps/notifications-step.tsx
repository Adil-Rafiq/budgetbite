'use client';

import { BellOff } from 'lucide-react';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { TimePicker } from '@/components/ui/time-picker';

export const NotificationsStep = () => {
  const { steps } = useOnboardingContext();
  const { values, actions, errors } = steps.notifications;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-[20px] border border-sage bg-white shadow-sm">
        {values.slots.map((slot, i) => (
          <div
            key={slot.mealTypeId}
            className={`flex items-center justify-between gap-4 px-5 py-4 ${
              i === 0 ? '' : 'border-t border-sage/70'
            }`}
          >
            <div
              className={`flex items-center gap-3 transition-opacity ${
                slot.enabled ? '' : 'opacity-40'
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green/10 text-sm font-bold uppercase text-dark-green">
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
              <button
                type="button"
                onClick={() => actions.toggleNotificationEnabled(slot.mealTypeId)}
                role="switch"
                aria-checked={slot.enabled}
                aria-label={
                  slot.enabled ? `Disable ${slot.label} reminder` : `Enable ${slot.label} reminder`
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  slot.enabled ? 'bg-green' : 'bg-sage'
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                    slot.enabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {errors.notificationSlots && (
        <p className="text-xs text-tomato">{errors.notificationSlots}</p>
      )}

      <div className="flex items-start gap-3 rounded-[20px] border border-sage bg-white p-5 shadow-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage/60">
          <BellOff className="h-4 w-4 text-dark-green" />
        </span>
        <div>
          <p className="text-sm font-semibold text-charcoal">Quiet by default</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate">
            We only send the reminders you opt in to. Toggle any meal off any time from settings.
          </p>
        </div>
      </div>
    </div>
  );
};
