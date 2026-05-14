import { Resend } from 'resend';

let cached: Resend | undefined;

const initResend = (): Resend => {
  if (cached) return cached;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set.');
  }
  cached = new Resend(apiKey);
  return cached;
};

// Proxied so `RESEND_API_KEY` is only required when something actually sends.
// Lets tooling that loads this module (e.g. better-auth's `auth:generate`
// CLI, which imports `auth.ts` → `email.service.ts` → here) run without a key.
export const resend = new Proxy({} as Resend, {
  get: (_target, prop, receiver) => Reflect.get(initResend(), prop, receiver),
}) as Resend;
