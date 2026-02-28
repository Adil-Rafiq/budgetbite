import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  plugins: [emailOTPClient()],
});

export type AuthErrorCode = keyof typeof authClient.$ERROR_CODES;
