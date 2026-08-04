import { z } from 'zod';

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * How long an emailed one-time code stays valid.
 *
 * This mirrors better-auth's `emailOTP` default (`expiresIn`, 300 seconds) —
 * the API does not override it. It lives here because the number is quoted to
 * the user in three places that had already drifted apart: the verification
 * email, the password-reset email, and the code-entry screens. The templates
 * were promising ten minutes for a code that stopped working after five.
 *
 * Raising it means setting `expiresIn` in `apps/api/src/lib/auth.ts` *and*
 * changing this constant; neither alone is enough.
 */
export const OTP_EXPIRY_MINUTES = 5;

/** Digits in an emailed one-time code. `otpLength` is likewise left at default. */
export const OTP_LENGTH = 6;

// ─── Inputs ──────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
  firstName: z.string().trim().min(1, 'First name is required').max(100, 'First name is too long'),
  lastName: z.string().trim().min(1, 'Last name is required').max(100, 'Last name is too long'),
});

export const loginSchema = z.object({
  email: z.email().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.email().trim(),
});

/**
 * Both halves of a reset arrive together: better-auth's
 * `/email-otp/reset-password` verifies the code and sets the password in one
 * call, so there is no intermediate "code accepted" state to model.
 *
 * `confirmPassword` has no server-side counterpart — it exists because the
 * failure this whole flow exists to repair is being locked out, and a typo in
 * a masked field would do exactly that again.
 */
export const resetPasswordSchema = z
  .object({
    email: z.email().trim(),
    otp: z
      .string()
      .trim()
      .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code`),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ─── Types ───────────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
