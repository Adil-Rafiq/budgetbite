'use client';

import { useEffect } from 'react';
import { Salad } from 'lucide-react';

import { DietaryTagPicker } from '@/components/dietary-tag-picker';
import { ALLERGEN_OPTIONS, DIETARY_PREFERENCE_OPTIONS } from '@/app/onboarding/constants';
import { useDietaryStep } from '@/app/onboarding/_hooks/use-dietary-step';
import { Section } from '@/app/(app)/profile/_components/section';
import { SaveRow } from '@/app/(app)/profile/_components/save-row';
import { useUpdateProfile, useUser } from '@/hooks/use-user';
import { getErrorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';

export function DietaryCard({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const { data: user } = useUser();
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const dietary = useDietaryStep(user?.profile);

  useEffect(() => {
    onDirtyChange(dietary.isDirty);
  }, [dietary.isDirty, onDirtyChange]);

  const onSubmit = dietary.handleSubmit(async (values) => {
    try {
      await updateProfile(values);
      dietary.markSaved(values);
      showToast.success({ title: 'Dietary rules updated' });
    } catch (err) {
      showToast.error({
        title: 'Could not save dietary rules',
        description: getErrorMessage(err),
      });
    }
  });

  return (
    <Section
      icon={Salad}
      title="Dietary rules"
      hint="Hard limits the planner has to work inside."
      tone="planner"
      isDirty={dietary.isDirty}
    >
      <form className="flex flex-1 flex-col gap-5" onSubmit={onSubmit} noValidate>
        <DietaryTagPicker
          label="Dietary preferences"
          hint="The AI plans meals around these."
          quickOptions={DIETARY_PREFERENCE_OPTIONS}
          selected={dietary.values.dietaryPreferences}
          error={dietary.errors.dietaryPreferences}
          onToggle={(tag) => dietary.actions.toggleTag('dietaryPreferences', tag)}
          onAdd={(tag) => dietary.actions.addTag('dietaryPreferences', tag)}
        />
        <DietaryTagPicker
          label="Allergens"
          hint="Hard limits — suggested meals will never include these."
          quickOptions={ALLERGEN_OPTIONS}
          selected={dietary.values.allergens}
          error={dietary.errors.allergens}
          onToggle={(tag) => dietary.actions.toggleTag('allergens', tag)}
          onAdd={(tag) => dietary.actions.addTag('allergens', tag)}
        />
        <SaveRow
          isDirty={dietary.isDirty}
          isSubmitting={dietary.isSubmitting}
          onRevert={dietary.reset}
        />
      </form>
    </Section>
  );
}
