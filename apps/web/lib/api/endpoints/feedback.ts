import { apiClient } from '@/lib/api/client';
import type { FeedbackInput, FeedbackResponse } from '@repo/shared';

export const feedbackApi = {
  submit: (input: FeedbackInput) =>
    apiClient.post('api/feedback', { json: input }).json<FeedbackResponse>(),
};
