'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import { authClient, type AuthErrorCode } from '@/lib/auth-client';
import { loginSchema, type LoginInput } from '@repo/shared';
import { showToast, type ToastOptions } from '@/lib/toast';
import { LogoIcon, GoogleIcon, GitHubIcon } from '@/components/icons';
import { getPostLoginPath } from '@/lib/auth/post-login-redirect';

type OAuthProvider = 'google' | 'github';

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

    const nextPath = await getPostLoginPath();

    showToast({
      title: 'Login successful',
      description:
        nextPath === '/dashboard'
          ? 'Welcome back! Redirecting to dashboard...'
          : 'Welcome back! Let’s finish setting up your account.',
      variant: 'success',
    });

    router.push(nextPath);
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
    'w-full rounded-xl border border-sage bg-white px-3.5 py-3 text-[14px] text-charcoal outline-none transition-colors placeholder:text-slate/50 focus:border-green';
  const labelClass = 'text-xs font-semibold uppercase tracking-wide text-slate';
  const busy = isSubmitting || oauthLoading !== null;

  return (
    <div className="relative min-h-screen bg-canvas text-charcoal antialiased">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #d4e8b0 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <header className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between px-6 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green text-white">
            <LogoIcon size={16} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Budget<span className="text-green">Bite</span>
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate transition-colors hover:text-charcoal"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-[440px] flex-col justify-center px-6 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sage bg-white px-4 py-1.5 shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green" />
            <span className="text-xs font-normal uppercase tracking-widest text-charcoal/70">
              Sign in to your account
            </span>
          </div>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight">
            Welcome <span className="text-green">back.</span>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-charcoal/60">
            Pick up where you left off.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-sage bg-white p-7 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="on" className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className={labelClass}>
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
              {errors.email && <p className="text-xs text-tomato">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-green transition-colors hover:text-dark-green"
                  onClick={() => router.push('/forgot-password')}
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className={`${inputClass} pr-11`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate transition-colors hover:text-charcoal"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-tomato">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green text-sm font-semibold text-white shadow-md transition-all hover:bg-dark-green disabled:pointer-events-none disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-sage" />
            <span className="text-xs font-normal text-charcoal/40">or</span>
            <span className="h-px flex-1 bg-sage" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              disabled={busy}
              className="flex min-h-11 items-center justify-center gap-2.5 rounded-xl border border-sage bg-white text-sm font-medium text-charcoal shadow-sm transition-all hover:border-green/40 hover:bg-canvas disabled:pointer-events-none disabled:opacity-50"
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon size={18} />
              )}
              {oauthLoading === 'google' ? 'Connecting…' : 'Google'}
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignIn('github')}
              disabled={busy}
              className="flex min-h-11 items-center justify-center gap-2.5 rounded-xl bg-charcoal text-sm font-medium text-white transition-all hover:bg-charcoal/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {oauthLoading === 'github' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GitHubIcon size={18} />
              )}
              {oauthLoading === 'github' ? 'Connecting…' : 'GitHub'}
            </button>
          </div>
        </div>

        <p className="mt-7 text-center text-[13px] text-charcoal/60">
          New to BudgetBite?{' '}
          <Link
            href="/register"
            className="inline-flex items-center gap-1 font-semibold text-green transition-colors hover:text-dark-green"
          >
            Create an account
            <Mail className="h-3.5 w-3.5" />
          </Link>
        </p>
      </main>
    </div>
  );
}
