import { betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '@repo/database';
import { sendEmail } from './email/email.service.js';
import { otpTemplate } from './email/templates/otp.template.js';
import { allowedOrigins } from './origins.js';

const crossSiteCookies = process.env.CROSS_SITE_COOKIES === 'true';
const cookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;

export const auth = betterAuth({
  trustedOrigins: allowedOrigins,
  database: drizzleAdapter(schema.db, {
    provider: 'pg',
    schema,
  }),
  advanced: {
    database: {
      generateId: 'uuid',
    },
    // Required when web and API are on different sites (e.g. Vercel + Render).
    // Browsers drop the session cookie cross-site unless SameSite=None; Secure.
    ...(crossSiteCookies && {
      defaultCookieAttributes: {
        sameSite: 'none' as const,
        secure: true,
        httpOnly: true,
      },
    }),
    // Use when web and API share a parent domain (app.example.com + api.example.com).
    // Set COOKIE_DOMAIN=.example.com to scope the cookie to both subdomains.
    ...(cookieDomain && {
      crossSubDomainCookies: {
        enabled: true,
        domain: cookieDomain,
      },
    }),
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
