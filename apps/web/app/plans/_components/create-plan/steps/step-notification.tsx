import { Input } from '@/components/ui/input';
import { useCreatePlanContext } from '@/app/plans/_context/create-plan-context';

export const StepNotifications = () => {
  const { steps } = useCreatePlanContext();
  const { values, actions, errors } = steps.notifications;

  return (
    <div className="flex flex-col gap-4">
      {values.slots.map((slot) => (
        <div key={slot.mealTypeId} className="flex items-center gap-3">
          <span className="w-24 text-xs text-muted-foreground">{slot.label}</span>
          <Input
            type="time"
            value={slot.time}
            onChange={(e) => actions.updateNotificationTime(slot.mealTypeId, e.target.value)}
            className="flex-1"
          />
        </div>
      ))}
      {errors.notificationSlots ? (
        <p className="text-xs text-destructive">{errors.notificationSlots}</p>
      ) : null}
    </div>
  );
};
