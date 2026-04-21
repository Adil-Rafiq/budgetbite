'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useCreatePlan } from '@/app/plans/_hooks/use-create-plan';

type CreatePlanContextValue = ReturnType<typeof useCreatePlan>;

const CreatePlanContext = createContext<CreatePlanContextValue | null>(null);

interface CreatePlanProviderProps {
  value: CreatePlanContextValue;
  children: ReactNode;
}

export const CreatePlanProvider = ({ value, children }: CreatePlanProviderProps) => (
  <CreatePlanContext.Provider value={value}>{children}</CreatePlanContext.Provider>
);

export const useCreatePlanContext = () => {
  const context = useContext(CreatePlanContext);
  if (!context) {
    throw new Error('useCreatePlanContext must be used inside CreatePlanProvider');
  }

  return context;
};
