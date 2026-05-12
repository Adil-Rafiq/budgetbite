import { Input } from '@/components/ui/input';
import { useCreatePlanContext } from '@/app/plans/_context/create-plan-context';

const PULSE = '#7f1c34';
const VAST = '#1a1a1a';
const SOFT = '#a6a691';

export const StepNotifications = () => {
  const { steps } = useCreatePlanContext();
  const { values, actions, errors } = steps.notifications;

  return (
    <div className="flex flex-col gap-3">
      {values.slots.map((slot) => (
        <div key={slot.mealTypeId} className="flex items-center gap-3">
          <span
            className="w-24 text-[10px] uppercase capitalize"
            style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.18em' }}
          >
            {slot.label}
          </span>
          <Input
            type="time"
            value={slot.time}
            onChange={(e) => actions.updateNotificationTime(slot.mealTypeId, e.target.value)}
            className="flex-1"
            style={{ fontFamily: 'var(--font-mono)', color: VAST }}
          />
        </div>
      ))}
      {errors.notificationSlots ? (
        <p className="text-[11px]" style={{ color: PULSE, fontFamily: 'var(--font-mono)' }}>
          {errors.notificationSlots}
        </p>
      ) : null}
    </div>
  );
};
