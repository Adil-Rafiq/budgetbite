import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code ?? undefined });
    return;
  }
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    res.status(400).json({ error: message, code: "VALIDATION_ERROR" });
    return;
  }
  if (err instanceof Error) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    return;
  }
  res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
}
