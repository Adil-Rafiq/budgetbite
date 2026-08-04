'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { FOCUS_RING } from '@/lib/focus-ring';

/**
 * The "that didn't work" panel for a submitted auth form.
 *
 * A rejected sign-in used to be a toast and nothing else. Toasts are the wrong
 * carrier for this: they time out, so the reason is gone by the time you look
 * back at the form; they render far from the fields they are about; and on a
 * phone they can cover the very button you were reaching for. WCAG 3.3.1 asks
 * that an input error be identified and described in text — text that is still
 * there when the user goes looking for it.
 *
 * Focus moves here on appearance so that a keyboard or screen-reader user is
 * told what happened instead of being left on a submit button that silently
 * did nothing. `role="alert"` alone announces but does not relocate, and the
 * recovery action — resending a verification code, switching to sign-in —
 * lives inside this panel, so focus needs to arrive next to it.
 */

export interface AuthFormError {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function AuthFormAlert({ error }: { error: AuthFormError | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) ref.current?.focus();
  }, [error]);

  if (!error) return null;

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className={`flex flex-col gap-2 rounded-xl border border-tomato/40 bg-tomato/[0.06] p-3.5 ${FOCUS_RING}`}
    >
      <div className="flex gap-2.5">
        <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-tomato-ink" />
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold text-tomato-ink">{error.title}</p>
          <p className="text-[13px] leading-relaxed text-charcoal/70">{error.description}</p>
        </div>
      </div>
      {error.action && (
        <button
          type="button"
          onClick={error.action.onClick}
          className={`ml-6.5 inline-flex min-h-9 w-fit items-center rounded-lg border border-tomato/40 bg-surface px-3 text-[13px] font-semibold text-tomato-ink transition-colors hover:bg-canvas ${FOCUS_RING}`}
        >
          {error.action.label}
        </button>
      )}
    </div>
  );
}
