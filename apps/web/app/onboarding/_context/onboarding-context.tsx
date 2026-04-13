'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useOnboarding } from '@/app/onboarding/_hooks/use-onboarding';

type OnboardingContextValue = ReturnType<typeof useOnboarding>;

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

interface OnboardingProviderProps {
  value: OnboardingContextValue;
  children: ReactNode;
}

export const OnboardingProvider = ({ value, children }: OnboardingProviderProps) => (
  <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
);

export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used inside OnboardingProvider');
  }

  return context;
};
