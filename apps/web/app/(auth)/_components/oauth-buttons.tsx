'use client';

import { Loader2 } from 'lucide-react';
import { GoogleIcon, GitHubIcon } from '@/components/icons';
import { FOCUS_RING } from '@/lib/focus-ring';

export type OAuthProvider = 'google' | 'github';

/**
 * Google and GitHub, identical on both auth pages and previously duplicated
 * between them.
 *
 * The state each button reports is the point. A provider hand-off leaves the
 * page for an external consent screen, and on a slow connection there is a
 * stretch where nothing has visibly happened yet. The spinner covers that
 * sighted-user case; `aria-busy` and the live region cover everyone else, who
 * otherwise heard nothing at all between pressing the button and the browser
 * landing somewhere new.
 */
export function OAuthButtons({
  pending,
  disabled,
  onSelect,
}: {
  pending: OAuthProvider | null;
  disabled: boolean;
  onSelect: (provider: OAuthProvider) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelect('google')}
          disabled={disabled}
          aria-busy={pending === 'google'}
          className={`flex min-h-11 items-center justify-center gap-2.5 rounded-xl border border-sand bg-surface text-sm font-medium text-charcoal shadow-sm transition-all hover:border-teal/40 hover:bg-canvas disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
        >
          {pending === 'google' ? (
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon size={18} />
          )}
          {pending === 'google' ? 'Connecting…' : 'Google'}
        </button>
        <button
          type="button"
          onClick={() => onSelect('github')}
          disabled={disabled}
          aria-busy={pending === 'github'}
          className={`flex min-h-11 items-center justify-center gap-2.5 rounded-xl bg-onyx text-sm font-medium text-white transition-all hover:bg-onyx/90 disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
        >
          {pending === 'github' ? (
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          ) : (
            <GitHubIcon size={18} />
          )}
          {pending === 'github' ? 'Connecting…' : 'GitHub'}
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {pending ? `Connecting to ${pending === 'google' ? 'Google' : 'GitHub'}…` : ''}
      </p>
    </>
  );
}
