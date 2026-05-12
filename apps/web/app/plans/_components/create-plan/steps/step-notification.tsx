import { Input } from '@/components/ui/input';
import { useCreatePlanContext } from '@/app/plans/_context/create-plan-context';

export const StepNotifications = () => {
  const { steps } = useCreatePlanContext();
  const { values, actions, errors } = steps.notifications;

  return (
    <div className="flex flex-col gap-3">
      {values.slots.map((slot) => (
        <div key={slot.mealTypeId} className="flex items-center gap-3">
          <span
            className="w-24 text-[10px] uppercase capitalize text-soft"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
          >
            {slot.label}
          </span>
          <Input
            type="time"
            value={slot.time}
            onChange={(e) => actions.updateNotificationTime(slot.mealTypeId, e.target.value)}
            className="flex-1 text-vast"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
      ))}
      {errors.notificationSlots ? (
        <p className="text-[11px] text-pulse" style={{ fontFamily: 'var(--font-mono)' }}>
          {errors.notificationSlots}
        </p>
      ) : null}
    </div>
  );
};
