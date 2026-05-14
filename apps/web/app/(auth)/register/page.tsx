'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Inter, JetBrains_Mono, Bricolage_Grotesque } from 'next/font/google';
import { Loader2 } from 'lucide-react';
import { authClient, type AuthErrorCode } from '@/lib/auth-client';
import { registerSchema, type RegisterInput } from '@repo/shared';
import { showToast, type ToastOptions } from '@/lib/toast';
import { Pill } from '@/components/ui/pill';
import { LogoIcon, GoogleIcon, GitHubIcon } from '@/components/icons';

type OAuthProvider = 'google' | 'github';

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz'],
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    const { error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
    });

    if (error) {
      const errorCode = error.code as AuthErrorCode;
      const toastOptions: ToastOptions = {
        title: 'Registration failed',
        description: error.message,
        variant: 'error',
      };

      switch (errorCode) {
        case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
          toastOptions.description =
            'An account with this email already exists. Please use a different email or login.';
          toastOptions.action = {
            label: 'Go to login',
            onClick: () => router.push('/login'),
          };
          break;
      }

      showToast(toastOptions);
      return;
    }

    const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
      email: data.email,
      type: 'email-verification',
    });

    if (otpError) {
      showToast({
        title: 'Could not send verification code',
        description:
          'Your account was created but we failed to send a verification email. Please try again from the login page.',
        variant: 'warning',
      });
      router.push('/login');
      return;
    }

    showToast({
      title: 'Account created!',
      description: 'A verification code has been sent to your email.',
      variant: 'success',
    });

    router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: `${process.env.NEXT_PUBLIC_WEB_URL}/oauth-callback`,
    });

    if (error) {
      setOauthLoading(null);
      showToast({
        title: 'Sign-in failed',
        description: error.message || `Could not start ${provider} sign-in. Please try again.`,
        variant: 'error',
      });
    }
  };

  const inputClass =
    'w-full rounded-[10px] border border-lumen-dk bg-white px-3.5 py-[11px] text-[14px] text-vast outline-none';
  const labelClass = 'text-[11px] uppercase text-ink';
  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.16em',
  };

  return (
    <div
      className={`${body.variable} ${display.variable} ${mono.variable} relative min-h-screen bg-lumen text-vast antialiased`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-32 -z-0 h-[360px] w-[700px] -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(3,79,70,0.14), rgba(255,169,70,0.10) 55%, transparent 75%)',
          filter: 'blur(20px)',
        }}
      />

      <header className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between px-8 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-fathom text-lumen">
            <LogoIcon />
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            BudgetBite
          </span>
        </Link>
        <Link href="/" className="text-[12px] text-ink" style={{ fontFamily: 'var(--font-mono)' }}>
          ← back to home
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-[460px] flex-col justify-center px-6 pb-16">
        <div className="text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-lumen-dk bg-white px-3 py-1 text-[11px] text-ink"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-fathom" />
            create your account
          </div>
          <h1
            className="mt-6"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.4vw, 38px)',
              fontWeight: 600,
              lineHeight: 1.06,
              letterSpacing: '-0.025em',
              whiteSpace: 'nowrap',
            }}
          >
            Welcome to <span className="text-fathom">BudgetBite.</span>
          </h1>
          <p className="mt-3 text-[15px] leading-[1.55] text-ink">
            Plan meals from real menus, on a real budget.
          </p>
        </div>

        <div
          className="mt-10 rounded-[14px] border border-lumen-dk bg-white p-7"
          style={{
            boxShadow:
              '0 1px 0 rgba(0,0,0,0.04), 0 30px 80px -30px rgba(26,26,26,0.18), 0 8px 30px -10px rgba(26,26,26,0.06)',
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="on" className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="firstName" className={labelClass} style={labelStyle}>
                  First name
                </label>
                <input
                  id="firstName"
                  placeholder="Ahmed"
                  autoComplete="given-name"
                  className={inputClass}
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-[12px] text-pulse">{errors.firstName.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="lastName" className={labelClass} style={labelStyle}>
                  Last name
                </label>
                <input
                  id="lastName"
                  placeholder="Khan"
                  autoComplete="family-name"
                  className={inputClass}
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-[12px] text-pulse">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className={labelClass} style={labelStyle}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="ahmed@example.com"
                autoComplete="email"
                className={inputClass}
                {...register('email')}
              />
              {errors.email && <p className="text-[12px] text-pulse">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className={labelClass} style={labelStyle}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className={`${inputClass} pr-10`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'hide' : 'show'}
                </button>
              </div>
              {errors.password && (
                <p className="text-[12px] text-pulse">{errors.password.message}</p>
              )}
            </div>

            <p className="text-[11px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
              By creating an account you agree to our{' '}
              <a href="#" className="text-fathom">
                terms
              </a>{' '}
              and{' '}
              <a href="#" className="text-fathom">
                privacy policy
              </a>
              .
            </p>

            <Pill
              type="submit"
              size="lg"
              disabled={isSubmitting || oauthLoading !== null}
              className="mt-1 w-full"
            >
              {isSubmitting ? (
                'Creating account…'
              ) : (
                <>
                  Create account
                  <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>→</span>
                </>
              )}
            </Pill>
          </form>

          <div className="relative my-7">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-lumen-dk" />
            <span
              className="relative mx-auto inline-block bg-white px-3 text-[10px] uppercase text-soft"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
            >
              or
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Pill
              variant="ghost"
              size="md"
              onClick={() => handleOAuthSignIn('google')}
              disabled={oauthLoading !== null || isSubmitting}
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {oauthLoading === 'google' ? 'Connecting…' : 'Google'}
            </Pill>
            <Pill
              variant="ghost"
              size="md"
              onClick={() => handleOAuthSignIn('github')}
              disabled={oauthLoading !== null || isSubmitting}
            >
              {oauthLoading === 'github' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <GitHubIcon />
              )}
              {oauthLoading === 'github' ? 'Connecting…' : 'GitHub'}
            </Pill>
          </div>
        </div>

        <p className="mt-7 text-center text-[13px] text-ink">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-fathom">
            Sign in →
          </Link>
        </p>
      </main>
    </div>
  );
}
