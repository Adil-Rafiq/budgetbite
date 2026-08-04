'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, MailCheck } from 'lucide-react';
import { OTP_EXPIRY_MINUTES, OTP_LENGTH } from '@repo/shared';
import { authClient } from '@/lib/auth-client';
import { FOCUS_RING } from '@/lib/focus-ring';
import { AuthShell } from '../_components/auth-shell';
import { OtpInput, type OtpInputHandle } from '../_components/otp-input';

const EMPTY_CODE = Array<string>(OTP_LENGTH).fill('');
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const router = useRouter();
  const email = useSearchParams().get('email') ?? '';

  const [digits, setDigits] = useState<string[]>(EMPTY_CODE);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRef = useRef<OtpInputHandle>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const submit = async (code: string) => {
    if (code.length !== OTP_LENGTH || submitting) return;

    setSubmitting(true);
    const { error: verifyError } = await authClient.emailOtp.verifyEmail({ email, otp: code });

    if (verifyError) {
      setSubmitting(false);
      setError('Invalid or expired code. Please try again.');
      setDigits(EMPTY_CODE);
      otpRef.current?.focusFirst();
      return;
    }

    router.push('/onboarding');
  };

  const onDigitsChange = (next: string[]) => {
    setDigits(next);
    if (error) setError(null);
    // Six digits is the whole answer, so there is nothing left to press.
    if (next.every((d) => d !== '')) void submit(next.join(''));
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    const { error: resendError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'email-verification',
    });

    if (resendError) {
      setError('Failed to resend code. Please try again.');
      return;
    }

    setDigits(EMPTY_CODE);
    setError(null);
    otpRef.current?.focusFirst();
    startCooldown();
  };

  const isComplete = digits.every((d) => d !== '');

  return (
    <AuthShell back={{ href: '/login', label: 'Back to sign in' }}>
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/15 text-teal-ink">
          <MailCheck aria-hidden className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight">
          Check your email.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-charcoal/60">
          Enter the {OTP_LENGTH}-digit code we sent to
        </p>
        <p className="mt-0.5 text-[15px] font-semibold text-charcoal">{email}</p>
      </div>

      <div className="mt-8 rounded-3xl border border-sand bg-surface p-7 shadow-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(digits.join(''));
          }}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2.5">
            <OtpInput
              ref={otpRef}
              label="Verification code"
              value={digits}
              onChange={onDigitsChange}
              disabled={submitting}
              invalid={!!error}
              describedBy="otp-status"
            />
            {/* One node, not two branches: the code is rejected without a page
                change, so the failure has to be announced where it appears.
                Swapping between two separate elements would have replaced the
                live region instead of updating it, and the message would never
                have been read out. */}
            <p
              id="otp-status"
              role="status"
              className={`text-center text-xs ${
                error ? 'font-medium text-tomato-ink' : 'text-slate'
              }`}
            >
              {error ?? `The code expires in ${OTP_EXPIRY_MINUTES} minutes.`}
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || !isComplete}
            aria-busy={submitting}
            className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-deep text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-deeper disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
          >
            {submitting ? (
              <>
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                Verify email
                <ArrowRight aria-hidden className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 border-t border-sand/70 pt-4 text-center text-[13px] text-charcoal/60">
          <span>Didn&apos;t receive it? </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className={`rounded px-1 font-semibold text-teal-ink transition-colors hover:underline disabled:cursor-not-allowed disabled:font-medium disabled:text-slate/60 disabled:no-underline ${FOCUS_RING}`}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-[13px] text-charcoal/50">
        Wrong address?{' '}
        <Link
          href="/register"
          className={`rounded px-1 font-semibold text-charcoal/70 transition-colors hover:underline ${FOCUS_RING}`}
        >
          Go back and re-enter it
        </Link>
      </p>
    </AuthShell>
  );
}
