'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Lock } from 'lucide-react';

import { Field } from '@/app/profile/_components/field';
import { Section } from '@/app/profile/_components/section';
import { SaveRow } from '@/app/profile/_components/save-row';
import {
  CREDENTIAL_PROVIDER_ID,
  providerLabel,
  useLinkedAccounts,
} from '@/hooks/use-linked-accounts';
import { authClient } from '@/lib/auth-client';
import { getErrorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';

const passwordSchema = z
  .object({
    // `min(1)`, not `min(8)`. The 8-character floor is a rule for the *new*
    // password; applying it to the current one told anyone with a shorter
    // legacy credential to "Enter your current password" while they were
    // looking at the correct one. Only the server can judge this field.
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordInput = z.infer<typeof passwordSchema>;

/**
 * Only rendered as a form when there is a password to change.
 *
 * Google and GitHub sign-in are both enabled, and this card used to render
 * unconditionally — so a Google-only user could fill in three fields, submit,
 * and be told "Could not change password — check your current password" for a
 * credential that had never existed. It was the last card in the mobile column,
 * which made it the page's closing impression: a form that blamed you for the
 * system's own missing state.
 */
export function PasswordCard({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const { data: accounts, isPending, isError } = useLinkedAccounts();

  const form = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const { isDirty, isSubmitting, errors } = form.formState;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (values: PasswordInput) => {
    setSaveError(null);
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      // Changing a password on a card hinted "Keep your account secure" ought to
      // end the sessions the old password could still be protecting. The card
      // says so below, so the behaviour and the promise match.
      revokeOtherSessions: true,
    });
    if (error) {
      const message = getErrorMessage(error, 'That current password did not match.');
      setSaveError(message);
      showToast.error({ title: 'Could not change password', description: message });
      return;
    }
    form.reset();
    showToast.success({
      title: 'Password changed',
      description: 'Other devices have been signed out.',
    });
  };

  // While the provider list is loading, hold the card's real footprint. A flat
  // 256px block against a ~400px card made the whole Account band jump when the
  // lookup resolved — under the thumb of anyone reaching for a nearby button.
  if (isPending) {
    return (
      <div
        role="status"
        aria-label="Loading your sign-in details"
        className="h-[400px] w-full animate-pulse rounded-2xl border border-sage bg-white shadow-sm"
      />
    );
  }

  const hasPassword =
    isError || !accounts
      ? true // Can't tell — show the form rather than hide a real control.
      : accounts.some((a) => a.providerId === CREDENTIAL_PROVIDER_ID);

  if (!hasPassword) {
    const social = (accounts ?? [])
      .map((a) => providerLabel(a.providerId))
      .filter((label, i, all) => all.indexOf(label) === i);

    return (
      <Section icon={KeyRound} title="Sign-in method" hint="How you get into this account.">
        <div className="flex flex-1 flex-col gap-3">
          <div className="rounded-xl border border-sage bg-canvas px-4 py-3">
            <p className="text-[13px] font-semibold text-charcoal">
              You sign in with {social.length ? social.join(' and ') : 'a linked account'}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate">
              There is no password on this account, so there is nothing to change here. Your sign-in
              is managed by {social.length === 1 ? social[0] : 'your provider'}.
            </p>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section
      icon={Lock}
      title="Password"
      hint="Changing it signs out your other devices."
      isDirty={isDirty}
    >
      <form
        className="flex flex-1 flex-col gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        {/* When the provider lookup fails we fall back to showing this form, so
            say so rather than letting a Google-only user discover it by being
            told their nonexistent password was wrong. */}
        {isError && (
          <p className="rounded-xl border border-sage bg-canvas px-3 py-2 text-[12px] text-slate">
            We couldn&apos;t check how you sign in. If you use Google or GitHub, there&apos;s no
            password on this account and this form won&apos;t apply.
          </p>
        )}
        <Field
          label="Current password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter current password"
          error={errors.currentPassword?.message}
          {...form.register('currentPassword')}
        />
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.newPassword?.message}
          {...form.register('newPassword')}
        />
        <Field
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat the new password"
          error={errors.confirmPassword?.message}
          {...form.register('confirmPassword')}
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
            form.reset();
            setSaveError(null);
          }}
          savingLabel="Changing…"
        />
      </form>
    </Section>
  );
}
