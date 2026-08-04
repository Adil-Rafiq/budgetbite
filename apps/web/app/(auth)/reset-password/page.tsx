'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import {
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@repo/shared';
import { authClient } from '@/lib/auth-client';
import { showToast } from '@/lib/toast';
import { FOCUS_RING } from '@/lib/focus-ring';
import { AuthField } from '../_components/auth-field';
import { AuthFormAlert, type AuthFormError } from '../_components/auth-form-alert';
import { AuthShell } from '../_components/auth-shell';
import { OtpInput, type OtpInputHandle } from '../_components/otp-input';

const EMPTY_CODE = Array<string>(OTP_LENGTH).fill('');
const RESEND_COOLDOWN_SECONDS = 60;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const email = useSearchParams().get('email') ?? '';

  const [digits, setDigits] = useState<string[]>(EMPTY_CODE);
  const [formError, setFormError] = useState<AuthFormError | null>(null);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const otpRef = useRef<OtpInputHandle>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    reValidateMode: 'onChange',
    defaultValues: { email, otp: '', password: '', confirmPassword: '' },
  });

  const startCooldown = () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startCooldown();
    otpRef.current?.focusFirst();
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const onDigitsChange = (next: string[]) => {
    setDigits(next);
    setFormError(null);
    // The form's `otp` is the joined string; the six cells are presentation.
    setValue('otp', next.join(''), { shouldValidate: false });
  };

  const requestNewCode = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    const { error } = await authClient.emailOtp.requestPasswordReset({ email });
    setResending(false);

    if (error) {
      setFormError({
        title: 'Could not send a new code',
        description: error.message || 'Something went wrong on our end. Please try again.',
      });
      return;
    }

    setDigits(EMPTY_CODE);
    setValue('otp', '');
    setFormError(null);
    otpRef.current?.focusFirst();
    startCooldown();
    showToast.success({
      title: 'New code sent',
      description: `Check ${email} for a fresh ${OTP_LENGTH}-digit code.`,
    });
  };

  const onSubmit = async (data: ResetPasswordInput) => {
    setFormError(null);

    const { error } = await authClient.emailOtp.resetPassword({
      email: data.email,
      otp: data.otp,
      password: data.password,
    });

    if (error) {
      // Every way this call fails — wrong code, expired code, too many wrong
      // guesses — is fixed by the same thing, so the recovery sits in the alert
      // rather than making the user hunt for the resend link below it.
      setFormError({
        title: 'Could not reset your password',
        description: error.message || 'That code did not work. Request a new one and try again.',
        action: { label: 'Send a new code', onClick: () => void requestNewCode() },
      });
      setDigits(EMPTY_CODE);
      setValue('otp', '');
      return;
    }

    showToast.success({
      title: 'Password changed',
      description: 'Sign in with your new password.',
    });
    router.replace('/login');
  };

  // Landing here without an address — a bookmark, a truncated link — leaves
  // nothing to reset. Say so and hand back the one screen that can fix it,
  // rather than rendering a form whose submit can only ever fail.
  if (!email) {
    return (
      <AuthShell back={{ href: '/login', label: 'Back to sign in' }}>
        <div className="rounded-3xl border border-sand bg-surface p-7 text-center shadow-2xl">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            This reset link is incomplete
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-charcoal/60">
            We don&apos;t know which account to reset. Start again and we&apos;ll send a fresh code.
          </p>
          <Link
            href="/forgot-password"
            className={`mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-deep text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-deeper ${FOCUS_RING}`}
          >
            Start over
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell back={{ href: '/login', label: 'Back to sign in' }}>
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/15 text-teal-ink">
          <ShieldCheck aria-hidden className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight">
          Choose a new <span className="text-teal-ink">password.</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-charcoal/60">
          If <span className="font-semibold text-charcoal">{email}</span> has an account, a{' '}
          {OTP_LENGTH}-digit code is on its way to it.
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

          <div className="flex flex-col gap-2.5">
            <OtpInput
              ref={otpRef}
              label="Reset code"
              value={digits}
              onChange={onDigitsChange}
              disabled={isSubmitting}
              invalid={!!errors.otp}
              describedBy="otp-status"
            />
            <p
              id="otp-status"
              role="status"
              className={`text-center text-xs ${
                errors.otp ? 'font-medium text-tomato-ink' : 'text-slate'
              }`}
            >
              {errors.otp?.message ?? `The code expires in ${OTP_EXPIRY_MINUTES} minutes.`}
            </p>
          </div>

          <AuthField
            label="New password"
            revealable
            placeholder="At least 8 characters"
            autoComplete="new-password"
            hint="Use at least 8 characters. Longer is better than more complicated."
            error={errors.password?.message}
            {...register('password')}
          />

          <AuthField
            label="Confirm new password"
            revealable
            placeholder="Type it once more"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
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
                Resetting…
              </>
            ) : (
              <>
                Reset password
                <ArrowRight aria-hidden className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 border-t border-sand/70 pt-4 text-center text-[13px] text-charcoal/60">
          <span>Didn&apos;t receive it? </span>
          <button
            type="button"
            onClick={() => void requestNewCode()}
            disabled={resendCooldown > 0 || resending}
            aria-busy={resending}
            className={`rounded px-1 font-semibold text-teal-ink transition-colors hover:underline disabled:cursor-not-allowed disabled:font-medium disabled:text-slate/60 disabled:no-underline ${FOCUS_RING}`}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>
        </div>
      </div>

      <p className="mt-7 text-center text-[13px] text-charcoal/60">
        Wrong address?{' '}
        <Link
          href="/forgot-password"
          className={`rounded px-1 font-semibold text-teal-ink transition-colors hover:underline ${FOCUS_RING}`}
        >
          Go back and re-enter it
        </Link>
      </p>
    </AuthShell>
  );
}
