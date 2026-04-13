'use client';

import { useMutation } from '@tanstack/react-query';
import type { NotificationPreferencesInput } from '@/app/onboarding/types';

interface SaveNotificationPreferencesInput {
  notificationSlots: NotificationPreferencesInput['notificationSlots'];
}

/**
 * Placeholder hook until notification preferences API is implemented.
 */
export const useSaveNotificationPreferences = () =>
  useMutation({
    mutationFn: async (_input: SaveNotificationPreferencesInput) => {
      return Promise.resolve();
    },
  });
