'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Inter, JetBrains_Mono, Bricolage_Grotesque } from 'next/font/google';
import { authClient } from '@/lib/auth-client';
import { Pill } from '@/components/ui/pill';
import { LogoIcon } from '@/components/icons';

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

const verifySchema = z.object({
  otp: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must be numbers only'),
});

type VerifyInput = z.infer<typeof verifySchema>;

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<VerifyInput>({
    resolver: zodResolver(verifySchema),
  });

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
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const onSubmit = async (data: VerifyInput) => {
    const { error } = await authClient.emailOtp.verifyEmail({
      email,
      otp: data.otp,
    });

    if (error) {
      setError('otp', { message: 'Invalid or expired code. Please try again.' });
      return;
    }

    router.push('/onboarding');
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'email-verification',
    });

    if (error) {
      setError('otp', { message: 'Failed to resend code. Please try again.' });
      return;
    }

    startCooldown();
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
          href="/login"
          className="text-[12px]"
          style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
        >
          ← back to login
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-[440px] flex-col justify-center px-6 pb-16">
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
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: FATHOM }}
            />
            verify · /auth/otp
          </div>
          <h1
            className="mt-6"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.6vw, 40px)',
              fontWeight: 600,
              lineHeight: 1.06,
              letterSpacing: '-0.025em',
            }}
          >
            Check your email.
          </h1>
          <p
            className="mt-3 text-[15px] leading-[1.55]"
            style={{ color: MUTED }}
          >
            We sent a 6-digit code to{' '}
            <span style={{ color: VAST, fontWeight: 500 }}>{email}</span>
          </p>
          <p
            className="mt-1 text-[11px]"
            style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
          >
            expires in 10 minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <input
              {...register('otp')}
              placeholder="000000"
              maxLength={6}
              autoFocus
              inputMode="numeric"
              style={{
                width: '100%',
                background: WHITE,
                border: `1px solid ${LUMEN_DK}`,
                borderRadius: 12,
                padding: '16px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: '0.5em',
                textAlign: 'center',
                color: VAST,
                outline: 'none',
              }}
            />
            {errors.otp && (
              <p
                className="text-[12px]"
                style={{ color: PULSE, fontFamily: 'var(--font-mono)' }}
              >
                {errors.otp.message}
              </p>
            )}
          </div>

          <Pill type="submit" size="lg" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Verifying…' : 'Verify email'}
            <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>↵</span>
          </Pill>

          <div className="mt-2 text-center text-[13px]" style={{ color: MUTED }}>
            <span>Didn&apos;t receive the code? </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="font-medium transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: FATHOM, fontFamily: 'var(--font-mono)' }}
            >
              {resendCooldown > 0 ? `resend in ${resendCooldown}s` : 'resend code'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
