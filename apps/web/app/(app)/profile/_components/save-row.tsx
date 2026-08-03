'use client';

import { FOCUS_RING } from '@/lib/focus-ring';

/**
 * The commit affordance for every card on this page.
 *
 * It replaced five differently-worded buttons ("Save changes", "Update
 * location", "Save dietary settings", "Save", "Change password") in two
 * different visual weights for identical stakes — the user had to re-read each
 * card to work out which word meant "commit" here. One verb, one weight.
 *
 * It also carries Revert, which is the other half of a disabled-until-dirty
 * form: the page could tell you that you had unsaved changes but gave you no
 * way to put them back.
 */
export function SaveRow({
  isDirty,
  isSubmitting,
  onRevert,
  label = 'Save',
  savingLabel = 'Saving…',
  disabled = false,
  hint,
}: {
  isDirty: boolean;
  isSubmitting: boolean;
  onRevert?: () => void;
  label?: string;
  savingLabel?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
      {/* Disabled styling uses explicit tokens rather than `opacity-*`. At 50%,
          white on `teal-deep` composites to about 2.04:1 — and since every card
          arrives clean, twelve washed-out buttons were this page's resting
          state. `check-tokens.mjs` cannot see through an opacity modifier, so
          the one place the palette discipline lapsed was the most repeated
          element on the surface. */}
      <button
        type="submit"
        disabled={disabled || isSubmitting || !isDirty}
        className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-[13px] font-semibold transition-colors ${FOCUS_RING} ${
          disabled || isSubmitting || !isDirty
            ? 'cursor-not-allowed bg-sand text-slate'
            : 'bg-teal-deep text-white hover:bg-teal-deeper active:scale-[0.97]'
        }`}
      >
        {isSubmitting ? savingLabel : label}
      </button>
      {onRevert && (
        <button
          type="button"
          onClick={onRevert}
          disabled={!isDirty || isSubmitting}
          className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-[13px] font-medium transition-colors ${FOCUS_RING} ${
            !isDirty || isSubmitting
              ? 'cursor-not-allowed border-sand bg-canvas text-slate'
              : 'border-sand bg-surface text-slate hover:bg-canvas active:scale-[0.97]'
          }`}
        >
          Revert
        </button>
      )}
      {hint && <p className="text-[11px] text-slate">{hint}</p>}
    </div>
  );
}
