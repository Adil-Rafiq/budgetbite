'use client';

import { useState } from 'react';
import { Plus, ShieldAlert } from 'lucide-react';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { DIETARY_PREFERENCE_OPTIONS, ALLERGEN_OPTIONS } from '@/app/onboarding/constants';
import { DietaryTagPicker } from '@/components/dietary-tag-picker';
import { FOCUS_RING } from '@/lib/focus-ring';

const cardClass = 'rounded-[20px] border border-sand bg-surface p-5 shadow-sm sm:p-6';

export const DietaryStep = () => {
  const { steps } = useOnboardingContext();
  const { values, errors, actions } = steps.dietary;

  // Allergens start collapsed. Rendering both pickers at once put 20 controls
  // on one screen for a step that is entirely optional; most people have no
  // allergens to declare and should not have to scroll past nine chips to
  // find that out.
  const [showAllergens, setShowAllergens] = useState(values.allergens.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className={cardClass}>
        <DietaryTagPicker
          label="Dietary preferences"
          hint="The AI plans around these. All optional — skip if anything goes."
          quickOptions={DIETARY_PREFERENCE_OPTIONS}
          selected={values.dietaryPreferences}
          error={errors.dietaryPreferences}
          onToggle={(tag) => actions.toggleTag('dietaryPreferences', tag)}
          onAdd={(tag) => actions.addTag('dietaryPreferences', tag)}
        />
      </div>

      {showAllergens ? (
        <div className={cardClass}>
          <DietaryTagPicker
            label="Allergens"
            hint="Hard limits — suggested meals will never include these. Also optional."
            quickOptions={ALLERGEN_OPTIONS}
            selected={values.allergens}
            error={errors.allergens}
            onToggle={(tag) => actions.toggleTag('allergens', tag)}
            onAdd={(tag) => actions.addTag('allergens', tag)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAllergens(true)}
          className={`flex min-h-11 items-center gap-3 rounded-[20px] border border-dashed border-sand bg-surface p-5 text-left transition-colors hover:border-teal-ink ${FOCUS_RING}`}
        >
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sand/60"
          >
            <ShieldAlert className="h-4 w-4 text-teal-ink" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-charcoal">
              <Plus aria-hidden className="h-3.5 w-3.5" />
              Add allergens
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-slate">
              Anything here becomes a hard limit — suggested meals will never include it.
            </span>
          </span>
        </button>
      )}
    </div>
  );
};
