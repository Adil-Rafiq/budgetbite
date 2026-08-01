'use client';

import { useQuery } from '@tanstack/react-query';

import { authClient } from '@/lib/auth-client';

/**
 * Which sign-in methods this account actually has.
 *
 * The profile page used to render a password form unconditionally, so a
 * Google-only user could fill in three fields and be told "check your current
 * password" for a password that was never created. The provider list is the
 * only honest way to know, and better-auth already exposes it.
 */
export const useLinkedAccounts = () =>
  useQuery({
    queryKey: ['auth', 'accounts'],
    queryFn: async () => {
      const { data, error } = await authClient.listAccounts();
      if (error) throw new Error(error.message ?? 'Could not load sign-in methods');
      return data ?? [];
    },
    staleTime: 5 * 60_000,
    // Same reason as `useUser` and `useActiveBudgetPlan`: this query feeds a
    // form on the profile page, and a refetch on window focus re-runs the
    // card's loading branch under someone who has already started typing.
    refetchOnWindowFocus: false,
  });

/** better-auth names the email+password account `credential`. */
export const CREDENTIAL_PROVIDER_ID = 'credential';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
};

export const providerLabel = (providerId: string): string =>
  PROVIDER_LABELS[providerId] ?? providerId.charAt(0).toUpperCase() + providerId.slice(1);
