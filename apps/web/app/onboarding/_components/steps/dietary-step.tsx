'use client';

import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { DIETARY_PREFERENCE_OPTIONS, ALLERGEN_OPTIONS } from '@/app/onboarding/constants';
import { DietaryTagPicker } from '@/components/dietary-tag-picker';

export const DietaryStep = () => {
  const { steps } = useOnboardingContext();
  const { values, errors, actions } = steps.dietary;

  return (
    <div className="flex flex-col gap-7">
      <DietaryTagPicker
        label="Dietary preferences"
        hint="The AI plans meals around these. Optional — skip if anything goes."
        quickOptions={DIETARY_PREFERENCE_OPTIONS}
        selected={values.dietaryPreferences}
        error={errors.dietaryPreferences}
        onToggle={(tag) => actions.toggleTag('dietaryPreferences', tag)}
        onAdd={(tag) => actions.addTag('dietaryPreferences', tag)}
      />

      <div className="h-px bg-lumen-dk" />

      <DietaryTagPicker
        label="Allergens"
        hint="Hard limits — suggested meals will never include these."
        quickOptions={ALLERGEN_OPTIONS}
        selected={values.allergens}
        error={errors.allergens}
        onToggle={(tag) => actions.toggleTag('allergens', tag)}
        onAdd={(tag) => actions.addTag('allergens', tag)}
      />
    </div>
  );
};
