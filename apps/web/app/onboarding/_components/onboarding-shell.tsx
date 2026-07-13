'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Rocket } from 'lucide-react';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { ONBOARDING_STEPS } from '@/app/onboarding/constants';
import type { OnboardingStepAccent } from '@/app/onboarding/types';
import { LogoIcon } from '@/components/icons';

interface OnboardingShellProps {
  children: React.ReactNode;
}

const ACCENT_CHIP: Record<OnboardingStepAccent, string> = {
  green: 'border-green/20 bg-green/10 text-dark-green',
  'dark-green': 'border-green/20 bg-sage/60 text-dark-green',
  tomato: 'border-tomato/20 bg-tomato/10 text-tomato',
};

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

  const StepIcon = currentStepData.icon;
  const totalSteps = ONBOARDING_STEPS.length;

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-charcoal antialiased">
      {/* ── Top header: brand bar + segmented progress ── */}
      <header className="sticky top-0 z-50 border-b border-sage bg-canvas/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green text-white">
                <LogoIcon size={14} />
              </span>
              <span className="font-display text-base font-bold tracking-tight">
                Budget<span className="text-green">Bite</span>
              </span>
            </Link>
            <span className="text-xs font-semibold text-slate">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-3 sm:px-6">
          <div className="flex gap-1.5">
            {ONBOARDING_STEPS.map((step, i) => (
              <div key={step.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-sage/50">
                <div
                  className="h-full rounded-full bg-green transition-all duration-500 ease-out"
                  style={{ width: i <= currentStep ? '100%' : '0%' }}
                />
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-40 pt-8 sm:px-6">
        <div key={currentStep} className="bb-step-in">
          <div className="mb-6">
            <div
              className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 ${ACCENT_CHIP[currentStepData.accent]}`}
            >
              <StepIcon className="h-3 w-3" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Step {currentStep + 1} — {currentStepData.label}
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {currentStepData.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate">{currentStepData.description}</p>
          </div>

          {children}
        </div>
      </main>

      {/* ── Sticky bottom nav ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-sage bg-canvas/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl border border-sage px-5 py-3.5 text-sm font-semibold text-slate transition-colors hover:border-charcoal hover:text-charcoal disabled:pointer-events-none disabled:invisible"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            {!isLastStep ? (
              <button
                type="button"
                onClick={handleContinue}
                disabled={isSubmitting || !canAdvance}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-tomato py-3.5 text-sm font-semibold text-white transition-all hover:bg-tomato/90 hover:shadow-lg hover:shadow-tomato/25 disabled:pointer-events-none disabled:opacity-50"
              >
                {isSubmitting ? (
                  'Saving…'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting || !canAdvance}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green py-3.5 text-sm font-semibold text-white transition-all hover:bg-dark-green hover:shadow-lg hover:shadow-green/25 disabled:pointer-events-none disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white"
                      style={{ borderTopColor: 'transparent' }}
                    />
                    Generating your plan…
                  </>
                ) : (
                  <>
                    Launch my BudgetBite
                    <Rocket className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Step dots */}
          <div className="mt-3 flex justify-center gap-2">
            {ONBOARDING_STEPS.map((step, i) => (
              <div
                key={step.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-6 bg-green'
                    : i < currentStep
                      ? 'w-1.5 bg-green'
                      : 'w-1.5 bg-sage'
                }`}
              />
            ))}
          </div>

          <p className="mt-3 text-center text-[11px] text-slate/70">
            You can change all of this later in settings.
          </p>
        </div>
      </div>
    </div>
  );
};
