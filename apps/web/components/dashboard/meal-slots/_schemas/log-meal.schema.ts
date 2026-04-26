import { z } from 'zod';

const baseFields = {
  actualAmountSpent: z.number({ error: 'Enter a valid amount' }).positive('Must be greater than 0'),
  rating: z.number().min(0).max(5),
  liked: z.boolean().nullable(),
  comment: z.string().optional(),
};

export const logSuggestionSchema = z.object(baseFields);
export const logCustomSchema = z.object({
  restaurantName: z.string().min(1, 'Restaurant name is required'),
  manualDescription: z.string().min(1, 'Please describe what you had'),
  ...baseFields,
});

export type LogSuggestionForm = z.infer<typeof logSuggestionSchema>;
export type LogCustomForm = z.infer<typeof logCustomSchema>;
