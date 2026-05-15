import { useCreatePlanContext } from '@/app/plans/_context/create-plan-context';
import { TimePicker } from '@/components/ui/time-picker';

export const StepNotifications = () => {
  const { steps } = useCreatePlanContext();
  const { values, actions, errors } = steps.notifications;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-ink">
        A single nudge per meal, at the time you choose. Toggle off any meal you don&apos;t want a
        reminder for.
      </p>

      <div className="overflow-hidden rounded-xl border border-lumen-dk bg-white">
        {values.slots.map((slot, i) => (
          <div
            key={slot.mealTypeId}
            className={`flex items-center justify-between gap-3 px-3 py-2.5 ${
              i === 0 ? '' : 'border-t border-lumen-dk'
            } ${i % 2 === 0 ? 'bg-white' : 'bg-lumen-dk/25'}`}
          >
            <div
              className={`flex items-center gap-2.5 transition-opacity ${
                slot.enabled ? '' : 'opacity-50'
              }`}
            >
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-fathom/10 text-[11px] text-fathom"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}
              >
                {slot.label.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-[13px] font-medium capitalize text-vast">{slot.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <TimePicker
                value={slot.time}
                onChange={(next) => actions.updateNotificationTime(slot.mealTypeId, next)}
                disabled={!slot.enabled}
                size="sm"
                aria-label={`${slot.label} reminder time`}
              />
              <button
                type="button"
                onClick={() => actions.toggleNotificationEnabled(slot.mealTypeId)}
                aria-pressed={slot.enabled}
                aria-label={
                  slot.enabled ? `Disable ${slot.label} reminder` : `Enable ${slot.label} reminder`
                }
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition active:scale-[0.96] ${
                  slot.enabled
                    ? 'bg-fathom text-lumen hover:bg-fathom/90'
                    : 'border border-lumen-dk bg-white text-soft hover:border-fathom/40 hover:text-ink'
                }`}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
              >
                {slot.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {errors.notificationSlots ? (
        <p className="text-[11px] text-pulse" style={{ fontFamily: 'var(--font-mono)' }}>
          {errors.notificationSlots}
        </p>
      ) : null}
    </div>
  );
};
