'use client';

import Link from 'next/link';
import { Inter, JetBrains_Mono, Bricolage_Grotesque } from 'next/font/google';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { ONBOARDING_STEPS } from '@/app/onboarding/constants';
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

interface OnboardingShellProps {
  children: React.ReactNode;
}

export const OnboardingShell = ({ children }: OnboardingShellProps) => {
  const {
    currentStep,
    currentStepData,
    actions: { handleContinue, handleBack, handleFinish },
    isLastStep,
    isSubmitting,
    canAdvance,
  } = useOnboardingContext();

  if (!currentStepData) return null;

  return (
    <div
      className={`${body.variable} ${display.variable} ${mono.variable} relative min-h-screen bg-lumen text-vast antialiased`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-32 -z-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(3,79,70,0.14), rgba(255,169,70,0.10) 55%, transparent 75%)',
          filter: 'blur(20px)',
        }}
      />

      <header className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between px-8 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-fathom text-lumen">
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
        <div className="text-[12px] text-ink" style={{ fontFamily: 'var(--font-mono)' }}>
          setup · step {String(currentStep + 1).padStart(2, '0')} /{' '}
          {String(ONBOARDING_STEPS.length).padStart(2, '0')}
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[560px] px-6 pb-16 pt-6">
        <ol className="mb-10 flex items-center justify-between">
          {ONBOARDING_STEPS.map((step, i) => {
            const isCurrent = i === currentStep;
            const isDone = i < currentStep;
            return (
              <li key={step.id} className="flex flex-1 items-center gap-3 last:flex-none">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums ${
                      isCurrent || isDone
                        ? 'border-fathom bg-fathom text-lumen'
                        : 'border-lumen-dk bg-white text-ink'
                    }`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {isDone ? '✓' : String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`hidden text-[12px] sm:inline ${
                      isCurrent ? 'font-medium text-vast' : 'font-normal text-ink'
                    }`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {step.id}
                  </span>
                </div>
                {i < ONBOARDING_STEPS.length - 1 && (
                  <div className={`h-px flex-1 ${isDone ? 'bg-fathom' : 'bg-lumen-dk'}`} />
                )}
              </li>
            );
          })}
        </ol>

        <div
          className="overflow-hidden rounded-[14px] border border-lumen-dk bg-white"
          style={{
            boxShadow:
              '0 1px 0 rgba(0,0,0,0.04), 0 30px 80px -30px rgba(26,26,26,0.18), 0 8px 30px -10px rgba(26,26,26,0.06)',
          }}
        >
          <div className="border-b border-lumen-dk bg-lumen px-7 py-6">
            <div
              className="text-[10px] uppercase text-fathom"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              {String(currentStep + 1).padStart(2, '0')} · {currentStepData.id}
            </div>
            <h1
              className="mt-2"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              {currentStepData.title}
            </h1>
            <p className="mt-1.5 text-[14px] text-ink">{currentStepData.description}</p>
          </div>

          <div className="px-7 py-7">{children}</div>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <Pill
            variant="ghost"
            size="md"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>←</span>
            Back
          </Pill>

          {!isLastStep ? (
            <Pill size="md" onClick={handleContinue} disabled={isSubmitting || !canAdvance}>
              {isSubmitting ? (
                'Saving…'
              ) : (
                <>
                  Continue
                  <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>→</span>
                </>
              )}
            </Pill>
          ) : (
            <Pill
              variant="accent"
              size="md"
              onClick={handleFinish}
              disabled={isSubmitting || !canAdvance}
            >
              {isSubmitting ? (
                'Finishing…'
              ) : (
                <>
                  Finish setup
                  <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>↵</span>
                </>
              )}
            </Pill>
          )}
        </div>

        <p
          className="mt-7 text-center text-[11px] text-soft"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          you can change all of this later in settings
        </p>
      </main>
    </div>
  );
};
