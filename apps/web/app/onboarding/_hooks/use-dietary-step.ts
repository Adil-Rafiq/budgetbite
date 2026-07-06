'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dietaryPreferencesSchema, type DietaryPreferencesInput } from '@/app/onboarding/types';
import type { UserProfile } from '@repo/shared';

export type DietaryField = keyof DietaryPreferencesInput;

const normalizeTag = (tag: string): string => tag.trim().toLowerCase();

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useDietaryStep = (profile?: UserProfile | null) => {
  const form = useForm<DietaryPreferencesInput>({
    resolver: zodResolver(dietaryPreferencesSchema),
    defaultValues: {
      dietaryPreferences: profile?.dietaryPreferences ?? [],
      allergens: profile?.allergens ?? [],
    },
  });

  // Sync form with profile when it loads or changes
  useEffect(() => {
    if (!profile) return;
    form.reset({
      dietaryPreferences: profile.dietaryPreferences ?? [],
      allergens: profile.allergens ?? [],
    });
  }, [profile, form]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const toggleTag = (field: DietaryField, tag: string) => {
    const normalized = normalizeTag(tag);
    const current = form.getValues(field);
    const next = current.includes(normalized)
      ? current.filter((t) => t !== normalized)
      : [...current, normalized];
    form.setValue(field, next, { shouldValidate: true, shouldDirty: true });
  };

  const addTag = (field: DietaryField, tag: string) => {
    const normalized = normalizeTag(tag);
    if (!normalized) return;
    const current = form.getValues(field);
    if (current.includes(normalized)) return;
    form.setValue(field, [...current, normalized], { shouldValidate: true, shouldDirty: true });
  };

  // ─── Exposed API ──────────────────────────────────────────────────────────

  return {
    handleSubmit: form.handleSubmit,
    isDirty: form.formState.isDirty,
    isSubmitting: form.formState.isSubmitting,

    values: {
      dietaryPreferences: form.watch('dietaryPreferences'),
      allergens: form.watch('allergens'),
    },

    errors: {
      dietaryPreferences: form.formState.errors.dietaryPreferences?.message,
      allergens: form.formState.errors.allergens?.message,
    },

    actions: {
      toggleTag,
      addTag,
    },
  };
};
