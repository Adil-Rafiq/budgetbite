'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, KeyRound, Loader2 } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@repo/shared';
import { authClient } from '@/lib/auth-client';
import { FOCUS_RING } from '@/lib/focus-ring';
import { AuthField } from '../_components/auth-field';
import { AuthFormAlert, type AuthFormError } from '../_components/auth-form-alert';
import { AuthShell } from '../_components/auth-shell';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<AuthFormError | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    reValidateMode: 'onChange',
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setFormError(null);

    const { error } = await authClient.emailOtp.requestPasswordReset({ email: data.email });

    if (error) {
      setFormError({
        title: 'Could not send the code',
        description: error.message || 'Something went wrong on our end. Please try again.',
      });
      return;
    }

    // Straight on, whether or not that address has an account. The endpoint
    // answers `{ success: true }` either way by design, and a UI that said
    // "no such account" would hand an attacker the account list this API
    // deliberately withholds. The next screen says "if it exists" instead.
    router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
  };

  return (
    <AuthShell back={{ href: '/login', label: 'Back to sign in' }}>
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/15 text-teal-ink">
          <KeyRound aria-hidden className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight">
          Forgot your <span className="text-teal-ink">password?</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-charcoal/60">
          Give us the email on your account and we&apos;ll send a code to reset it.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-sand bg-surface p-7 shadow-2xl">
        <form
          onSubmit={handleSubmit(onSubmit)}
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
            autoFocus
            error={errors.email?.message}
            {...register('email')}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className={`mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-deep text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-deeper disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                Sending code…
              </>
            ) : (
              <>
                Send reset code
                <ArrowRight aria-hidden className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-7 text-center text-[13px] text-charcoal/60">
        Remembered it?{' '}
        <Link
          href="/login"
          className={`rounded px-1 font-semibold text-teal-ink transition-colors hover:underline ${FOCUS_RING}`}
        >
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
