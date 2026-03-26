'use client';

import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NotificationsStepProps {
  notificationTimes: string[];
  addNotificationTime: () => void;
  removeNotificationTime: (index: number) => void;
  updateNotificationTime: (index: number, value: string) => void;
}

export const NotificationsStep = ({
  notificationTimes,
  addNotificationTime,
  removeNotificationTime,
  updateNotificationTime,
}: NotificationsStepProps) => (
  <div className="flex flex-col gap-4">
    {notificationTimes.map((time, index) => (
      <div key={index} className="flex items-center gap-3">
        <Input
          type="time"
          value={time}
          onChange={(e) => updateNotificationTime(index, e.target.value)}
          className="flex-1"
        />
        {notificationTimes.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeNotificationTime(index)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Remove time</span>
          </Button>
        )}
      </div>
    ))}
    {notificationTimes.length < 5 && (
      <Button variant="outline" size="sm" onClick={addNotificationTime} className="self-start">
        <Plus className="w-4 h-4 mr-1" />
        Add time
      </Button>
    )}
  </div>
);
