import type { Response } from "express";
import { feedbackSchema } from "../lib/validation.js";
import { feedbackService } from "../services/feedback.service.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

export async function submitFeedback(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const body = feedbackSchema.parse(req.body);
  const result = await feedbackService.submit(userId, body);
  res.status(201).json(result);
}
