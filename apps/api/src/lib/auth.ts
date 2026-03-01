import { betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '@repo/database';
import { sendEmail } from './email/email.service.js';
import { otpTemplate } from './email/templates/otp.template.js';

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
        input: false, // don't allow users to set this field directly
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
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

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === 'email-verification') {
          await sendEmail({
            to: email,
            ...otpTemplate(otp),
          });
        }
      },
    }),
  ],
});
