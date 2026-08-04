'use client';

import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FOCUS_RING } from '@/lib/focus-ring';

/**
 * One field for the sign-in and sign-up forms.
 *
 * The two pages had a field apiece, copied between them, and the copies had to
 * be kept honest by hand — which is how both ended up rendering their error
 * text as a plain paragraph floating near the input. A sighted user reads the
 * proximity; a screen reader gets an input that reports itself as valid and a
 * sentence nobody is pointed at. Wiring `aria-invalid` and `aria-describedby`
 * here makes that structural instead of something each page must remember.
 *
 * The visible focus treatment matters for the same reason. The inputs used to
 * set `outline-none` and shift the border to brand `teal` — a 4.17:1 fill that
 * `lib/focus-ring` already documents as too weak to carry meaning on its own,
 * and a hue change that is invisible to anyone who cannot separate teal from
 * sand. `FOCUS_RING` is the ring the rest of the app tabs through.
 */

interface AuthFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  label: string;
  /** Validation message. Presence also marks the input invalid. */
  error?: string;
  /** Standing instructions — password rules, format notes. Always visible. */
  hint?: string;
  /** Renders a show/hide toggle and takes over the input's `type`. */
  revealable?: boolean;
  /** Trailing control on the label row, e.g. a "Forgot?" link. */
  labelAction?: ReactNode;
}

const INPUT_CLASS =
  'w-full rounded-xl border border-sand bg-surface px-3.5 py-3 text-[14px] text-charcoal outline-none transition-colors placeholder:text-slate/50 hover:border-sand-edge focus:border-teal-ink aria-[invalid=true]:border-tomato';

export function AuthField({
  label,
  error,
  hint,
  revealable = false,
  labelAction,
  className,
  type,
  ...inputProps
}: AuthFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const [revealed, setRevealed] = useState(false);

  // `revealable` owns the type outright rather than defaulting around it: a
  // caller passes `revealable` and no `type`, and any fallback to `'text'` here
  // would render the password in the clear — and strip the field of the
  // password semantics that `autocomplete="current-password"` depends on.
  const resolvedType = revealable ? (revealed ? 'text' : 'password') : (type ?? 'text');

  // Both, in that order: the standing instruction first, then whatever went
  // wrong. Joining them is the only way a field can carry two descriptions.
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-slate">
          {label}
        </label>
        {labelAction}
      </div>

      <div className={revealable ? 'relative' : undefined}>
        <input
          {...inputProps}
          id={id}
          type={resolvedType}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`${INPUT_CLASS} ${FOCUS_RING} ${revealable ? 'pr-13' : ''} ${className ?? ''}`}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            // A toggle, so it reports its state rather than renaming itself
            // mid-interaction — the label stays the action, `aria-pressed`
            // carries whether the password is currently exposed.
            aria-pressed={revealed}
            aria-controls={id}
            aria-label="Show password"
            title={revealed ? 'Hide password' : 'Show password'}
            className={`absolute right-1.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-slate transition-colors hover:bg-canvas hover:text-charcoal ${FOCUS_RING}`}
          >
            {revealed ? (
              <EyeOff aria-hidden className="h-4 w-4" />
            ) : (
              <Eye aria-hidden className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {hint && (
        <p id={hintId} className="text-xs leading-relaxed text-slate">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-tomato-ink">
          {error}
        </p>
      )}
    </div>
  );
}
