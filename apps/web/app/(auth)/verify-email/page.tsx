'use client';

import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, MailCheck } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { LogoIcon } from '@/components/icons';

const OTP_LENGTH = 6;
const EMPTY_CODE = Array<string>(OTP_LENGTH).fill('');

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [digits, setDigits] = useState<string[]>(EMPTY_CODE);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setResendCooldown(60);
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
    inputsRef.current[0]?.focus();
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const focusCell = (index: number) => {
    const clamped = Math.max(0, Math.min(OTP_LENGTH - 1, index));
    inputsRef.current[clamped]?.focus();
    inputsRef.current[clamped]?.select();
  };

  const submit = async (code: string) => {
    if (code.length !== OTP_LENGTH || submitting) return;

    setSubmitting(true);
    const { error: verifyError } = await authClient.emailOtp.verifyEmail({ email, otp: code });

    if (verifyError) {
      setSubmitting(false);
      setError('Invalid or expired code. Please try again.');
      setDigits(EMPTY_CODE);
      focusCell(0);
      return;
    }

    router.push('/onboarding');
  };

  const setCode = (next: string[]) => {
    setDigits(next);
    if (error) setError(null);
    if (next.every((d) => d !== '')) void submit(next.join(''));
  };

  const handleChange = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, '');
    if (!value) {
      // Clearing the cell (e.g. selecting and deleting).
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    const next = [...digits];
    // Spread across cells when multiple digits arrive (autofill / fast typing).
    for (let i = 0; i < value.length && index + i < OTP_LENGTH; i++) {
      next[index + i] = value[i]!;
    }
    setCode(next);
    focusCell(index + value.length);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        next[index - 1] = '';
        setDigits(next);
        focusCell(index - 1);
      }
      if (error) setError(null);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusCell(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusCell(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...EMPTY_CODE];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]!;
    setCode(next);
    focusCell(pasted.length);
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
    focusCell(0);
    startCooldown();
  };

  const isComplete = digits.every((d) => d !== '');

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
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate transition-colors hover:text-charcoal"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-[440px] flex-col justify-center px-6 pb-16">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green/15 text-green">
            <MailCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight">
            Check your email.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-charcoal/60">
            Enter the 6-digit code we sent to
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-charcoal">{email}</p>
        </div>

        <div className="mt-8 rounded-3xl border border-sage bg-white p-7 shadow-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit(digits.join(''));
            }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {digits.map((digit, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-2.5">
                    <input
                      ref={(el) => {
                        inputsRef.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      maxLength={OTP_LENGTH}
                      aria-label={`Digit ${i + 1}`}
                      value={digit}
                      disabled={submitting}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onPaste={handlePaste}
                      onFocus={(e) => e.target.select()}
                      className={`h-14 w-11 rounded-xl border-2 text-center text-2xl font-bold tabular-nums outline-none transition-all sm:h-16 sm:w-12 ${
                        error
                          ? 'border-tomato/60 bg-tomato/5 text-tomato'
                          : digit
                            ? 'border-green/50 bg-white text-charcoal'
                            : 'border-sage bg-canvas text-charcoal'
                      } focus:border-green focus:bg-white focus:ring-4 focus:ring-green/15 disabled:opacity-60`}
                    />
                    {/* subtle 3-3 grouping divider */}
                    {i === 2 && <span className="h-0.5 w-2 rounded-full bg-sage" />}
                  </div>
                ))}
              </div>
              {error ? (
                <p className="text-center text-xs font-medium text-tomato">{error}</p>
              ) : (
                <p className="text-center text-xs text-slate">The code expires in 10 minutes.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !isComplete}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green text-sm font-semibold text-white shadow-md transition-all hover:bg-dark-green disabled:pointer-events-none disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  Verify email
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 border-t border-sage/70 pt-4 text-center text-[13px] text-charcoal/60">
            <span>Didn&apos;t receive it? </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="font-semibold text-green transition-colors hover:text-dark-green disabled:cursor-not-allowed disabled:font-medium disabled:text-slate/60"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-[13px] text-charcoal/50">
          Wrong address?{' '}
          <Link
            href="/register"
            className="font-semibold text-charcoal/70 transition-colors hover:text-charcoal"
          >
            Go back and re-enter it
          </Link>
        </p>
      </main>
    </div>
  );
}
