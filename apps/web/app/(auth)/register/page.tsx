'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { authClient, type AuthErrorCode } from '@/lib/auth-client';
import { registerSchema, type RegisterInput } from '@repo/shared';
import { showToast } from '@/lib/toast';
import { LogoIcon } from '@/components/icons';
import { FOCUS_RING } from '@/lib/focus-ring';
import { AuthField } from '../_components/auth-field';
import { AuthFormAlert, type AuthFormError } from '../_components/auth-form-alert';
import { OAuthButtons, type OAuthProvider } from '../_components/oauth-buttons';

export default function RegisterPage() {
  const router = useRouter();
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [formError, setFormError] = useState<AuthFormError | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const onSubmit = async (data: RegisterInput) => {
    setFormError(null);

    const name = `${data.firstName} ${data.lastName}`.trim();
    const { error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name,
    });

    if (error) {
      if ((error.code as AuthErrorCode) === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
        setFormError({
          title: 'That email is already registered',
          description: 'Sign in with it instead, or create the account under a different address.',
          action: { label: 'Go to sign in', onClick: () => router.push('/login') },
        });
        return;
      }

      setFormError({
        title: 'Could not create your account',
        description: error.message || 'Something went wrong. Please try again.',
      });
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

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-[460px] flex-col justify-center px-6 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sand bg-surface px-4 py-1.5 shadow-sm">
            <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-teal" />
            <span className="text-xs font-normal uppercase tracking-widest text-charcoal/70">
              Create your account
            </span>
          </div>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight">
            Welcome to <span className="text-teal-ink">BudgetBite.</span>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-charcoal/60">
            Plan meals from real menus, on a real budget.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-sand bg-surface p-7 shadow-2xl">
          <form
            onSubmit={handleSubmit(onSubmit)}
            // See the note on the sign-in form: Zod owns validation, so the
            // native bubble must not fire ahead of it.
            noValidate
            autoComplete="on"
            className="flex flex-col gap-5"
          >
            <AuthFormAlert error={formError} />

            <div className="grid grid-cols-2 gap-4">
              <AuthField
                label="First name"
                placeholder="Ahmed"
                autoComplete="given-name"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <AuthField
                label="Last name"
                placeholder="Khan"
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

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
              placeholder="At least 8 characters"
              autoComplete="new-password"
              // A placeholder is not an instruction: it vanishes at the first
              // keystroke, exactly when the rule starts to matter, and screen
              // readers treat it as a fallback for a missing label rather than
              // as guidance. The rule now stands next to the field permanently
              // and is announced as the field's description.
              hint="Use at least 8 characters. Longer is better than more complicated."
              error={errors.password?.message}
              {...register('password')}
            />

            <p className="text-xs leading-relaxed text-charcoal/45">
              By creating an account you agree to our{' '}
              <a
                href="#"
                className={`rounded font-medium text-teal-ink hover:underline ${FOCUS_RING}`}
              >
                terms
              </a>{' '}
              and{' '}
              <a
                href="#"
                className={`rounded font-medium text-teal-ink hover:underline ${FOCUS_RING}`}
              >
                privacy policy
              </a>
              .
            </p>

            <button
              type="submit"
              disabled={busy}
              aria-busy={isSubmitting}
              className={`mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-deep text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-deeper disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
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
          Already have an account?{' '}
          <Link
            href="/login"
            className={`inline-flex items-center gap-1 rounded px-1 font-semibold text-teal-ink transition-colors hover:underline ${FOCUS_RING}`}
          >
            Sign in
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </p>
      </main>
    </div>
  );
}
