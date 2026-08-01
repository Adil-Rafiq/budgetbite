'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { Field } from '@/app/(app)/profile/_components/field';
import { Section } from '@/app/(app)/profile/_components/section';
import { SaveRow } from '@/app/(app)/profile/_components/save-row';
import { useUser } from '@/hooks/use-user';
import { authClient } from '@/lib/auth-client';
import { getErrorMessage } from '@/lib/api/errors';
import { splitName } from '@/lib/name';
import { showToast } from '@/lib/toast';

/** Long enough for any real name, short enough that the field cannot be abused. */
const NAME_MAX = 60;

/**
 * Last name is optional on purpose. `splitName` returns an empty `lastName` for
 * any single-token name — mononyms are ordinary in Pakistan, and Google OAuth
 * hands back one-word names routinely. Requiring it meant those users loaded
 * the page, touched any field, and were told their own name was invalid, with
 * focus thrown to a box they could never satisfy.
 */
const accountSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(NAME_MAX, 'That name is too long'),
  lastName: z.string().trim().max(NAME_MAX, 'That name is too long'),
});

type AccountInput = z.infer<typeof accountSchema>;

export function PersonalCard({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  const initial = useMemo<AccountInput>(() => splitName(user?.name), [user?.name]);

  const form = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: initial,
  });

  const { isDirty, isSubmitting, errors } = form.formState;

  // Re-seed from the server only when there is nothing to lose. This effect ran
  // on every `['users','me']` invalidation, which meant saving any *other* card
  // on the page silently reverted a half-typed name here.
  useEffect(() => {
    if (isDirty) return;
    form.reset(initial);
  }, [initial, form, isDirty]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (values: AccountInput) => {
    setSaveError(null);
    const fullName = `${values.firstName} ${values.lastName}`.trim();
    const { error } = await authClient.updateUser({ name: fullName });
    if (error) {
      // Persisted next to the button as well as toasted: the toast expires and
      // leaves the card reading "Unsaved" with no reason attached.
      const message = getErrorMessage(error, 'Something went wrong.');
      setSaveError(message);
      showToast.error({ title: 'Could not save your name', description: message });
      return;
    }
    // Settle the form at the values we just wrote, so the card stops reading as
    // dirty without waiting for the refetch to come back.
    form.reset(values);
    queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    showToast.success({ title: 'Name updated' });
  };

  return (
    <Section icon={User} title="Personal" hint="Your name and email." isDirty={isDirty}>
      <form
        className="flex flex-1 flex-col gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="First name"
            autoComplete="given-name"
            maxLength={NAME_MAX}
            error={errors.firstName?.message}
            {...form.register('firstName')}
          />
          <Field
            label="Last name (optional)"
            autoComplete="family-name"
            maxLength={NAME_MAX}
            error={errors.lastName?.message}
            {...form.register('lastName')}
          />
        </div>
        {/* `readOnly`, not `disabled`: disabled took the field *and* its
            explanation out of the tab order, so a keyboard user met an inert
            box and never learned why. */}
        <Field
          label="Email"
          type="email"
          value={user?.email ?? ''}
          readOnly
          onChange={() => {}}
          note="Email changes aren't supported yet."
          className="text-slate"
        />
        {saveError && (
          <p role="alert" className="text-[12px] font-medium text-tomato-ink">
            {saveError}
          </p>
        )}
        <SaveRow
          isDirty={isDirty}
          isSubmitting={isSubmitting}
          onRevert={() => {
            form.reset(initial);
            setSaveError(null);
          }}
        />
      </form>
    </Section>
  );
}
