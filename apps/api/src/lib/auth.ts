import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '@repo/database';

export const auth = betterAuth({
  trustedOrigins: [process.env.WEB_URL || 'http://localhost:3000'],
  database: drizzleAdapter(schema.db, {
    provider: 'pg',
    schema,
  }),
  advanced: {
    database: {
      generateId: 'uuid',
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ['user', 'admin'] as const,
        defaultValue: 'user',
        required: true,
        input: false,
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
  },

  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
});
