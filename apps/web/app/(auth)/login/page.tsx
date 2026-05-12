'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Inter, JetBrains_Mono, Bricolage_Grotesque } from 'next/font/google';
import { Loader2 } from 'lucide-react';
import { authClient, type AuthErrorCode } from '@/lib/auth-client';
import { loginSchema, type LoginInput } from '@repo/shared';
import { showToast, type ToastOptions } from '@/lib/toast';
import { Pill } from '@/components/ui/pill';

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

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      const errorCode = error.code as AuthErrorCode;
      const toastOptions: ToastOptions = {
        title: 'Login failed',
        description: error.message,
        variant: 'error',
      };

      switch (errorCode) {
        case 'EMAIL_NOT_VERIFIED':
          toastOptions.title = 'Email not verified';
          toastOptions.description =
            'Your account is not verified yet. Please verify your email before logging in.';
          toastOptions.action = {
            label: 'Request new OTP',
            onClick: async () => {
              await authClient.emailOtp.sendVerificationOtp({
                email: data.email,
                type: 'email-verification',
              });

              showToast.success({
                title: 'OTP Sent',
                description: 'A new OTP has been sent to your email address.',
              });

              router.push('/verify-email?email=' + encodeURIComponent(data.email));
            },
          };
          break;

        default:
          toastOptions.title = 'Login failed';
          toastOptions.description =
            error.message || 'Something went wrong while trying to log in.';
      }

      showToast(toastOptions);
      console.error(error.message);
      return;
    }

    showToast({
      title: 'Login successful',
      description: 'Welcome back! Redirecting to dashboard...',
      variant: 'success',
    });

    router.push('/dashboard');
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: WHITE,
    border: `1px solid ${LUMEN_DK}`,
    borderRadius: 10,
    padding: '11px 14px',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: VAST,
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.16em',
    color: MUTED,
    fontSize: 11,
    textTransform: 'uppercase',
  };

  return (
    <div
      className={`${body.variable} ${display.variable} ${mono.variable} relative min-h-screen antialiased`}
      style={{ fontFamily: 'var(--font-body)', background: LUMEN, color: VAST }}
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
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: FATHOM, color: LUMEN }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11v9a1 1 0 0 0 1 1h6v-7h4v7h6a1 1 0 0 0 1-1v-9" />
              <path d="M1 11 12 3l11 8" />
            </svg>
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
        <Link
          href="/"
          className="text-[12px]"
          style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
        >
          ← back to home
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-[460px] flex-col justify-center px-6 pb-16">
        <div className="text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]"
            style={{
              fontFamily: 'var(--font-mono)',
              borderColor: LUMEN_DK,
              background: WHITE,
              color: MUTED,
            }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: FATHOM }} />
            sign in to your account
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
            Welcome <span style={{ color: FATHOM }}>back.</span>
          </h1>
          <p className="mt-3 text-[15px] leading-[1.55]" style={{ color: MUTED }}>
            Pick up where you left off.
          </p>
        </div>

        <div
          className="mt-10 rounded-[14px] p-7"
          style={{
            background: WHITE,
            border: `1px solid ${LUMEN_DK}`,
            boxShadow:
              '0 1px 0 rgba(0,0,0,0.04), 0 30px 80px -30px rgba(26,26,26,0.18), 0 8px 30px -10px rgba(26,26,26,0.06)',
          }}
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="on"
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="email" style={labelStyle}>Email</label>
              <input
                id="email"
                type="email"
                placeholder="ahmed@example.com"
                autoComplete="email"
                style={inputStyle}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-[12px]" style={{ color: PULSE }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" style={labelStyle}>Password</label>
                <button
                  type="button"
                  className="text-[11px]"
                  style={{ fontFamily: 'var(--font-mono)', color: FATHOM }}
                  onClick={() => router.push('/forgot-password')}
                >
                  forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: 40 }}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: MUTED, fontFamily: 'var(--font-mono)', fontSize: 11 }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'hide' : 'show'}
                </button>
              </div>
              {errors.password && (
                <p className="text-[12px]" style={{ color: PULSE }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <Pill
              type="submit"
              size="lg"
              disabled={isSubmitting || oauthLoading !== null}
              className="mt-1 w-full"
            >
              {isSubmitting ? 'Signing in…' : (
                <>
                  Sign in
                  <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>↵</span>
                </>
              )}
            </Pill>
          </form>

          <div className="relative my-7">
            <div
              className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
              style={{ background: LUMEN_DK }}
            />
            <span
              className="relative mx-auto inline-block px-3 text-[10px] uppercase"
              style={{
                background: WHITE,
                fontFamily: 'var(--font-mono)',
                color: SOFT,
                letterSpacing: '0.18em',
              }}
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
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              )}
              {oauthLoading === 'github' ? 'Connecting…' : 'GitHub'}
            </Pill>
          </div>
        </div>

        <p className="mt-7 text-center text-[13px]" style={{ color: MUTED }}>
          New to BudgetBite?{' '}
          <Link href="/register" style={{ color: FATHOM, fontWeight: 500 }}>
            Create an account →
          </Link>
        </p>
      </main>
    </div>
  );
}
