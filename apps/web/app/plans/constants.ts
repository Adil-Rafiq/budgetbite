import { Wallet, Bell } from 'lucide-react';
import type { CreatePlanStep } from '@/app/plans/types';

export const CREATE_PLAN_STEPS: readonly CreatePlanStep[] = [
  {
    id: 'budget',
    icon: Wallet,
    title: 'Create your budget plan',
    description: 'Set up your new meal budget',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notification times',
    description: 'When should we remind you to order?',
  },
] as const;
