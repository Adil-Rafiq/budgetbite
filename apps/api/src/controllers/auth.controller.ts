import type { Request, Response } from "express";
import { registerSchema, loginSchema } from "../lib/validation.js";
import { authService } from "../services/auth.service.js";

export async function register(req: Request, res: Response): Promise<void> {
  const body = registerSchema.parse(req.body);
  const result = await authService.register(body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body);
  const result = await authService.login(body);
  res.json(result);
}
