'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Rocket } from 'lucide-react';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { ONBOARDING_STEPS } from '@/app/onboarding/constants';
import type { OnboardingStepAccent } from '@/app/onboarding/types';
import { LogoIcon } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';

interface OnboardingShellProps {
  children: React.ReactNode;
}

const ACCENT_CHIP: Record<OnboardingStepAccent, string> = {
  teal: 'border-teal/30 bg-teal/10 text-teal-ink',
  deep: 'border-teal/30 bg-sand/60 text-teal-ink',
};

export const OnboardingShell = ({ children }: OnboardingShellProps) => {
  const {
    currentStep,
    currentStepData,
    actions: { handleContinue, handleBack, handleFinish },
    isLastStep,
    isSubmitting,
    canAdvance,
    blockedReason,
  } = useOnboardingContext();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);

  // Move focus to the new step's heading. The step content remounts on change,
  // so without this focus stays on the footer button and a screen-reader user
  // is never told the screen changed.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [currentStep]);

  if (!currentStepData) return null;

  const StepIcon = currentStepData.icon;
  const totalSteps = ONBOARDING_STEPS.length;

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-charcoal antialiased">
      {/* ── Top header: brand bar + segmented progress ── */}
      <header className="sticky top-0 z-50 border-b border-sand bg-canvas/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <Link
              href="/"
              aria-label="BudgetBite home"
              className={`flex items-center gap-2.5 rounded-lg ${FOCUS_RING_ON_CANVAS}`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-deep text-white">
                <LogoIcon size={14} />
              </span>
              <span className="font-display text-base font-bold tracking-tight">
                Budget<span className="text-teal-ink">Bite</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-3 sm:px-6">
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={currentStep + 1}
            aria-label={`Step ${currentStep + 1} of ${totalSteps}: ${currentStepData.label}`}
            className="flex gap-1.5"
          >
            {ONBOARDING_STEPS.map((step, i) => (
              <div key={step.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand/50">
                <div
                  className="h-full rounded-full bg-teal-deep transition-all duration-500 ease-out"
                  style={{ width: i <= currentStep ? '100%' : '0%' }}
                />
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Announces the step change to assistive tech, which a remount alone
          does not do. */}
      <div aria-live="polite" className="sr-only">
        {`Step ${currentStep + 1} of ${totalSteps}: ${currentStepData.title}`}
      </div>

      {/* ── Main content ── */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-44 pt-8 sm:px-6">
        <div key={currentStep} className="bb-step-in">
          <div className="mb-6">
            <div
              className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 ${ACCENT_CHIP[currentStepData.accent]}`}
            >
              <StepIcon aria-hidden className="h-3 w-3" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Step {currentStep + 1} — {currentStepData.label}
              </span>
            </div>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-3xl font-bold leading-tight tracking-tight outline-none sm:text-4xl"
            >
              {currentStepData.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate">{currentStepData.description}</p>
          </div>

          {children}
        </div>
      </main>

      {/* ── Sticky bottom nav ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-sand bg-canvas/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-sand px-5 py-3.5 text-sm font-semibold text-slate transition-colors hover:border-charcoal hover:text-charcoal disabled:pointer-events-none disabled:invisible ${FOCUS_RING_ON_CANVAS}`}
            >
              <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
              Back
            </button>

            {!isLastStep ? (
              <button
                type="button"
                onClick={handleContinue}
                disabled={isSubmitting || !canAdvance}
                aria-describedby={blockedReason ? 'nav-blocked-reason' : undefined}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-deep py-3.5 text-sm font-semibold text-white transition-all hover:bg-teal-deeper hover:shadow-lg hover:shadow-teal-ink/25 disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING_ON_CANVAS}`}
              >
                {isSubmitting ? (
                  'Saving…'
                ) : (
                  <>
                    Continue
                    <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting || !canAdvance}
                aria-describedby={blockedReason ? 'nav-blocked-reason' : undefined}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-deep py-3.5 text-sm font-semibold text-white transition-all hover:bg-teal-deeper hover:shadow-lg hover:shadow-teal-ink/25 disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING_ON_CANVAS}`}
              >
                {isSubmitting ? (
                  <>
                    <span
                      aria-hidden
                      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white"
                      style={{ borderTopColor: 'transparent' }}
                    />
                    {/* Not "Generating your plan…" — plan generation is
                        env-gated and fire-and-forget on the API. What is
                        actually happening here is the plan being created. */}
                    Setting up your plan…
                  </>
                ) : (
                  <>
                    Launch my BudgetBite
                    <Rocket aria-hidden className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* One reason line, replacing a second row of step dots that
              duplicated the header progress bar and looked clickable. */}
          <p
            id="nav-blocked-reason"
            className="mt-3 text-center text-xs text-slate"
            aria-live="polite"
          >
            {blockedReason ?? 'You can change all of this later in settings.'}
          </p>
        </div>
      </div>
    </div>
  );
};
