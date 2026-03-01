import { createAuthClient } from 'better-auth/react';
import { emailOTPClient, inferAdditionalFields } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  plugins: [
    emailOTPClient(),
    inferAdditionalFields({
      user: {
        role: {
          type: 'string',
          defaultValue: 'user',
        },
        latitude: {
          type: 'number',
          required: false,
        },
        longitude: {
          type: 'number',
          required: false,
        },
      },
    }),
  ],
});

export type AuthErrorCode = keyof typeof authClient.$ERROR_CODES;
