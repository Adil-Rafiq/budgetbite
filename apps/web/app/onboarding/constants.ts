import { MapPin, Wallet, Bell, Salad } from 'lucide-react';
import type { OnboardingStep } from '@/app/onboarding/types';

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: 'location',
    icon: MapPin,
    label: 'Your location',
    accent: 'green',
    title: 'Where do you eat out?',
    description:
      "We'll find restaurants near you with real menus and live prices to build your plan.",
  },
  {
    id: 'dietary',
    icon: Salad,
    label: 'Dietary preferences',
    accent: 'dark-green',
    title: 'Anything we should know?',
    description: 'Tell the AI what you love to eat — and what it must always avoid.',
  },
  {
    id: 'budget',
    icon: Wallet,
    label: 'Budget setup',
    accent: 'tomato',
    title: 'How much do you want to spend?',
    description: 'Set a realistic food budget. The AI makes every rupee count across real menus.',
  },
  {
    id: 'notifications',
    icon: Bell,
    label: 'Meal reminders',
    accent: 'green',
    title: 'When should we nudge you?',
    description: 'A single reminder per meal, at the time you choose. Toggle off any you skip.',
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
