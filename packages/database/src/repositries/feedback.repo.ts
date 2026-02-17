import { eq } from "drizzle-orm";

import { db } from "../db.js";
import { feedback, type Feedback, type NewFeedback } from "../schema";

export const feedbackRepository = {
  async findByMealChoiceId(mealChoiceId: string): Promise<Feedback | undefined> {
    const [row] = await db.select().from(feedback).where(eq(feedback.mealChoiceId, mealChoiceId)).limit(1);
    return row;
  },

  async create(data: NewFeedback): Promise<Feedback> {
    const [inserted] = await db.insert(feedback).values(data).returning();
    if (!inserted) throw new Error("Feedback insert failed");
    return inserted;
  },

  async upsert(data: NewFeedback): Promise<Feedback> {
    const existing = await this.findByMealChoiceId(data.mealChoiceId);
    if (existing) {
      const [updated] = await db
        .update(feedback)
        .set({
          rating: data.rating ?? existing.rating,
          liked: data.liked ?? existing.liked,
          comment: data.comment ?? existing.comment,
        })
        .where(eq(feedback.id, existing.id))
        .returning();
      if (!updated) throw new Error("Feedback update failed");
      return updated;
    }
    return this.create(data);
  },
};
