'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authClient, type AuthErrorCode } from '@/lib/auth-client';
import { registerSchema, type RegisterInput } from '@repo/shared';
import { showToast, type ToastOptions } from '@/lib/toast';
import { LogoIcon, GoogleIcon, GitHubIcon } from '@/components/icons';

type OAuthProvider = 'google' | 'github';

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

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-[460px] flex-col justify-center px-6 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sage bg-white px-4 py-1.5 shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green" />
            <span className="text-xs font-normal uppercase tracking-widest text-charcoal/70">
              Create your account
            </span>
          </div>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight">
            Welcome to <span className="text-green">BudgetBite.</span>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-charcoal/60">
            Plan meals from real menus, on a real budget.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-sage bg-white p-7 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="on" className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="firstName" className={labelClass}>
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
                  <p className="text-xs text-tomato">{errors.firstName.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="lastName" className={labelClass}>
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
                  <p className="text-xs text-tomato">{errors.lastName.message}</p>
                )}
              </div>
            </div>

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
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
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

            <p className="text-xs leading-relaxed text-charcoal/45">
              By creating an account you agree to our{' '}
              <a href="#" className="font-medium text-green hover:text-dark-green">
                terms
              </a>{' '}
              and{' '}
              <a href="#" className="font-medium text-green hover:text-dark-green">
                privacy policy
              </a>
              .
            </p>

            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green text-sm font-semibold text-white shadow-md transition-all hover:bg-dark-green disabled:pointer-events-none disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
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
          Already have an account?{' '}
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-semibold text-green transition-colors hover:text-dark-green"
          >
            Sign in
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      </main>
    </div>
  );
}
