'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Loader2, Mail } from 'lucide-react';
import { authClient, type AuthErrorCode } from '@/lib/auth-client';
import { loginSchema, type LoginInput } from '@repo/shared';
import { showToast } from '@/lib/toast';
import { LogoIcon } from '@/components/icons';
import { FOCUS_RING } from '@/lib/focus-ring';
import { getPostLoginPath } from '@/lib/auth/post-login-redirect';
import { AuthField } from '../_components/auth-field';
import { AuthFormAlert, type AuthFormError } from '../_components/auth-form-alert';
import { OAuthButtons, type OAuthProvider } from '../_components/oauth-buttons';

export default function LoginPage() {
  const router = useRouter();
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [formError, setFormError] = useState<AuthFormError | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    // Re-validate as the user repairs a field rather than only on the next
    // submit, so a corrected email stops reading as wrong the moment it is.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);

    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      if ((error.code as AuthErrorCode) === 'EMAIL_NOT_VERIFIED') {
        setFormError({
          title: 'Email not verified',
          description:
            'This account has not been verified yet. Verify your email address to sign in.',
          action: {
            label: 'Send a new code',
            onClick: async () => {
              await authClient.emailOtp.sendVerificationOtp({
                email: data.email,
                type: 'email-verification',
              });
              router.push('/verify-email?email=' + encodeURIComponent(data.email));
            },
          },
        });
        return;
      }

      setFormError({
        title: 'Could not sign in',
        description: error.message || 'Something went wrong while signing in. Please try again.',
      });
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
    setFormError(null);
    setOauthLoading(provider);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: `${process.env.NEXT_PUBLIC_WEB_URL}/oauth-callback`,
    });

    if (error) {
      setOauthLoading(null);
      setFormError({
        title: 'Sign-in failed',
        description: error.message || `Could not start ${provider} sign-in. Please try again.`,
      });
    }
  };

  const busy = isSubmitting || oauthLoading !== null;

  return (
    <div className="relative min-h-screen bg-canvas text-charcoal antialiased">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, var(--color-sand) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <header className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between px-6 py-6 sm:px-8">
        <Link
          href="/"
          aria-label="BudgetBite — go to home"
          className={`flex items-center gap-2.5 rounded-lg ${FOCUS_RING}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-deep text-white">
            <LogoIcon size={16} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Budget<span className="text-teal-ink">Bite</span>
          </span>
        </Link>
        <Link
          href="/"
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-slate transition-colors hover:text-charcoal ${FOCUS_RING}`}
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-[440px] flex-col justify-center px-6 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sand bg-surface px-4 py-1.5 shadow-sm">
            <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-teal" />
            <span className="text-xs font-normal uppercase tracking-widest text-charcoal/70">
              Sign in to your account
            </span>
          </div>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight">
            Welcome <span className="text-teal-ink">back.</span>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-charcoal/60">
            Pick up where you left off.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-sand bg-surface p-7 shadow-2xl">
          <form
            onSubmit={handleSubmit(onSubmit)}
            // `noValidate` hands validation to Zod. Without it the native
            // bubble for `type="email"` fires first and blocks submit, so the
            // resolver's own message never gets a chance to render.
            noValidate
            autoComplete="on"
            className="flex flex-col gap-5"
          >
            <AuthFormAlert error={formError} />

            <AuthField
              label="Email"
              type="email"
              inputMode="email"
              placeholder="ahmed@example.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              error={errors.email?.message}
              {...register('email')}
            />

            <AuthField
              label="Password"
              revealable
              placeholder="Your password"
              autoComplete="current-password"
              error={errors.password?.message}
              labelAction={
                <Link
                  href="/forgot-password"
                  className={`rounded px-1 text-xs font-medium text-teal-ink transition-colors hover:underline ${FOCUS_RING}`}
                >
                  Forgot?
                </Link>
              }
              {...register('password')}
            />

            <button
              type="submit"
              disabled={busy}
              aria-busy={isSubmitting}
              className={`mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-deep text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-deeper disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span aria-hidden className="h-px flex-1 bg-sand" />
            <span className="text-xs font-normal text-charcoal/40">or</span>
            <span aria-hidden className="h-px flex-1 bg-sand" />
          </div>

          <OAuthButtons pending={oauthLoading} disabled={busy} onSelect={handleOAuthSignIn} />
        </div>

        <p className="mt-7 text-center text-[13px] text-charcoal/60">
          New to BudgetBite?{' '}
          <Link
            href="/register"
            className={`inline-flex items-center gap-1 rounded px-1 font-semibold text-teal-ink transition-colors hover:underline ${FOCUS_RING}`}
          >
            Create an account
            <Mail aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </p>
      </main>
    </div>
  );
}
