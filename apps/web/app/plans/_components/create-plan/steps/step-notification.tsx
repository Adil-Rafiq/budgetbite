import { useCreatePlanContext } from '@/app/plans/_context/create-plan-context';
import { TimePicker } from '@/components/ui/time-picker';
import { FOCUS_RING } from '@/lib/focus-ring';

export const StepNotifications = () => {
  const { steps } = useCreatePlanContext();
  const { values, actions, errors } = steps.notifications;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-slate">
        A single nudge per meal, at the time you choose. Times are pre-filled — adjust only the ones
        you want to move, or toggle off any meal you don&apos;t want a reminder for.
      </p>

      <div className="overflow-hidden rounded-xl border border-sage bg-white">
        {values.slots.map((slot, i) => {
          const slotError = errors.slots[i];
          return (
            <div
              key={slot.mealTypeId}
              className={`flex flex-col gap-1.5 px-3 py-2.5 ${
                i === 0 ? '' : 'border-t border-sage'
              } ${i % 2 === 0 ? 'bg-white' : 'bg-canvas'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div
                  className={`flex items-center gap-2.5 transition-opacity ${
                    slot.enabled ? '' : 'opacity-50'
                  }`}
                >
                  <span
                    aria-hidden
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green/10 text-[11px] font-semibold text-green-deep"
                  >
                    {slot.label.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="text-[13px] font-medium capitalize text-charcoal">
                    {slot.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TimePicker
                    value={slot.time}
                    onChange={(next) => actions.updateNotificationTime(slot.mealTypeId, next)}
                    disabled={!slot.enabled}
                    size="sm"
                    aria-label={`${slot.label} reminder time`}
                    aria-invalid={slotError ? true : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => actions.toggleNotificationEnabled(slot.mealTypeId)}
                    aria-pressed={slot.enabled}
                    aria-label={
                      slot.enabled
                        ? `Disable ${slot.label} reminder`
                        : `Enable ${slot.label} reminder`
                    }
                    className={`min-h-11 rounded-full px-3 text-[10px] font-semibold tracking-[0.1em] transition active:scale-[0.96] ${FOCUS_RING} ${
                      slot.enabled
                        ? 'bg-green-deep text-white hover:bg-green-deeper'
                        : 'border border-sage bg-white text-slate/60 hover:border-green/40 hover:text-slate'
                    }`}
                  >
                    {slot.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Per-row, beside the control that caused it. The step used to
                  read the array's own `.message`, which react-hook-form never
                  sets for item failures — so an invalid time blocked "Next"
                  while displaying nothing at all. */}
              {slotError && (
                <p role="alert" className="text-[11px] font-medium text-tomato-ink">
                  {slotError}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {errors.notificationSlots && (
        <p role="alert" className="text-[11px] font-medium text-tomato-ink">
          {errors.notificationSlots}
        </p>
      )}
    </div>
  );
};
