'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { showToast } from '@/lib/toast';

/**
 * Signing out, in one place.
 *
 * There were three copies of this — the app header, the admin shell and the
 * profile page — and they had already drifted apart: two cleared the query
 * cache and one did not, so signing out of `/admin` left every admin query,
 * including the user list, sitting in memory for whoever signed in next.
 *
 * Each copy also shared the same two faults:
 *
 * 1. `authClient.signOut()` resolves with `{ error }`; it does not throw. The
 *    `try`/`finally` around it therefore caught nothing, and a failed sign-out
 *    was indistinguishable from a successful one — the cache was cleared and
 *    `/login` was pushed while the session cookie was still live. `proxy.ts`
 *    then bounced the still-authenticated user straight back to `/dashboard`.
 *    From the outside: you press Sign out, the menu closes, the app flickers,
 *    and you are still signed in.
 * 2. `router.push` left the signed-in page one Back press away, served from the
 *    App Router's client cache without the proxy getting a say. `replace` plus
 *    `refresh` drops the entry and invalidates every cached RSC payload.
 */
export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);
  // A ref, not the state above: the guard has to hold within a single tick, and
  // it keeps `signOut` referentially stable for callers that pass it onward.
  const inFlight = useRef(false);

  const signOut = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSigningOut(true);

    let failure: string | undefined;
    try {
      const { error } = await authClient.signOut();
      if (error) failure = error.message;
    } catch (err) {
      // better-fetch reports most failures through `error`, but a request that
      // never leaves the browser (offline, DNS, CORS preflight) can still throw.
      failure = err instanceof Error ? err.message : undefined;
    }

    if (failure !== undefined) {
      inFlight.current = false;
      setSigningOut(false);
      showToast.error({
        title: 'Could not sign out',
        description:
          failure || 'You are still signed in on this device. Check your connection and try again.',
      });
      return;
    }

    // The cache outlives the session otherwise, so the next account to sign in
    // on this browser sees the previous one's data on first paint.
    queryClient.clear();
    router.replace('/login');
    router.refresh();
    // `signingOut` deliberately stays true: the tree is on its way out, and
    // releasing the button first would let a second press fire mid-navigation.
  }, [queryClient, router]);

  return { signOut, signingOut };
}
