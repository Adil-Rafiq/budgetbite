import { MapPin, Wallet, Bell } from 'lucide-react';
import type { OnboardingStep } from '@/app/onboarding/types';

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: 'location',
    icon: MapPin,
    title: 'Set your location',
    description: 'We use this to find nearby restaurants',
  },
  {
    id: 'budget',
    icon: Wallet,
    title: 'Create your budget plan',
    description: 'Set up your first meal budget',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notification times',
    description: 'When should we remind you to order?',
  },
] as const;

export const DEFAULT_COORDINATES = {
  latitude: 24.8607,
  longitude: 67.0011,
} as const;
