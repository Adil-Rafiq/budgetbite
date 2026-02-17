import type { FeedbackInput } from "../lib/validation.js";
import { feedbackRepository, orderRepository } from "@budgetbite/database";
import { AppError } from "../middleware/error.middleware.js";

export const feedbackService = {
  async submit(userId: string, input: FeedbackInput) {
    const choice = await orderRepository.findById(input.mealChoiceId);
    if (!choice) throw new AppError(404, "Meal choice not found", "NOT_FOUND");
    if (choice.userId !== userId) throw new AppError(403, "Forbidden", "FORBIDDEN");

    const feedback = await feedbackRepository.upsert({
      mealChoiceId: input.mealChoiceId,
      userId,
      rating: input.rating ?? undefined,
      liked: input.liked ?? undefined,
      comment: input.comment ?? undefined,
    });
    return {
      id: feedback.id,
      mealChoiceId: feedback.mealChoiceId,
      rating: feedback.rating,
      liked: feedback.liked,
      comment: feedback.comment,
      createdAt: feedback.createdAt,
    };
  },
};
