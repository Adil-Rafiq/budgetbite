import { MapPin, Wallet, Bell, Salad, ClipboardCheck } from 'lucide-react';
import type { OnboardingStep } from '@/app/onboarding/types';

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: 'location',
    icon: MapPin,
    label: 'Your location',
    accent: 'green',
    title: 'Where do you eat out?',
    description:
      "Pick the spot you order to. We'll only suggest restaurants that actually deliver near it.",
  },
  {
    id: 'dietary',
    icon: Salad,
    label: 'Dietary preferences',
    accent: 'deep',
    title: 'Anything we should know?',
    description: 'Tell the AI what you love to eat — and what it must always avoid.',
  },
  {
    id: 'budget',
    icon: Wallet,
    label: 'Budget setup',
    accent: 'green',
    title: 'How much do you want to spend?',
    description: 'Set a realistic food budget. Every suggestion has to fit inside what is left.',
  },
  {
    id: 'notifications',
    icon: Bell,
    label: 'Meal reminders',
    accent: 'deep',
    title: 'When should we nudge you?',
    description: 'A single reminder per meal, at the time you choose. Toggle off any you skip.',
  },
  {
    id: 'review',
    icon: ClipboardCheck,
    label: 'Review',
    accent: 'green',
    title: 'Here’s your plan',
    description:
      'Check it over before we start planning meals. Anything here can still be changed.',
  },
] as const;

/**
 * Where the map *looks* before the user has picked anything — a view hint, not
 * a value. It is deliberately never written into the location form: a user in
 * Lahore who taps straight through must not silently commit a Karachi address,
 * because proximity is the whole mechanic and `getPostLoginPath` would then
 * treat them as onboarded forever.
 */
export const DEFAULT_MAP_VIEW = {
  latitude: 24.8607,
  longitude: 67.0011,
} as const;

/**
 * Radius used for the "restaurants near you" proof on the location step.
 * Defined in `@/lib/nearby` and re-exported here so the profile surface — where
 * the same decision gets *changed* — proves it against the identical number;
 * existing imports from this module keep working.
 */
export { NEARBY_PROOF_RADIUS_KM as ONBOARDING_NEARBY_RADIUS_KM } from '@/lib/nearby';

/**
 * The API caps a plan at 5 meals per day (`createBudgetPlanSchema`). Defined in
 * `@/lib/budget-plan/schema` and re-exported here so the /plans wizard enforces
 * the same ceiling; existing imports from this module keep working.
 */
export { MAX_MEALS_PER_DAY } from '@/lib/budget-plan/schema';

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
