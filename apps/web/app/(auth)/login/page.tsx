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
