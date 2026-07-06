import { MapPin, Wallet, Bell, Salad } from 'lucide-react';
import type { OnboardingStep } from '@/app/onboarding/types';

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: 'location',
    icon: MapPin,
    title: 'Set your location',
    description: 'We use this to find nearby restaurants',
  },
  {
    id: 'dietary',
    icon: Salad,
    title: 'Dietary preferences',
    description: 'Tell the AI what you eat — and what it must avoid',
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

/** Common quick-pick dietary preferences; users can also add their own. */
export const DIETARY_PREFERENCE_OPTIONS = [
  'halal',
  'vegetarian',
  'vegan',
  'no beef',
  'no seafood',
  'low-carb',
  'high-protein',
] as const;

/** Common quick-pick allergens; users can also add their own. */
export const ALLERGEN_OPTIONS = [
  'peanuts',
  'tree nuts',
  'dairy',
  'eggs',
  'shellfish',
  'fish',
  'gluten',
  'soy',
  'sesame',
] as const;
