'use client';

import { forwardRef, useId } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FOCUS_RING } from '@/lib/focus-ring';

/**
 * A labelled text field that actually announces its own failure.
 *
 * Every error on this page used to be a bare red `<p>`: no `role="alert"`, no
 * `aria-invalid`, no `aria-describedby`. Submitting an invalid form moved
 * nothing, announced nothing, and left a screen-reader user with a form that
 * had simply refused. The `DietaryTagPicker` embedded on the same page had all
 * three — this is the rest of the page catching up with it.
 *
 * The label colour is `text-slate`, not `text-slate/60`: at 10px with 0.18em
 * tracking the faded variant measured about 3.1:1 on white, under the 4.5:1
 * floor, on every field label on the page.
 */
export const FIELD_LABEL_CLASS = 'text-[10px] font-semibold uppercase tracking-[0.18em] text-slate';

interface FieldProps extends Omit<React.ComponentProps<typeof Input>, 'id'> {
  label: string;
  error?: string;
  /** Persistent explanatory text, rendered under the control. */
  note?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, note, className, ...inputProps },
  ref,
) {
  const id = useId();
  const errorId = `${id}-error`;
  const noteId = `${id}-note`;
  const describedBy = [error ? errorId : null, note ? noteId : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className={FIELD_LABEL_CLASS}>
        {label}
      </Label>
      {/* `FOCUS_RING` overrides the shadcn default. `Input` ships
          `focus-visible:ring-ring/50`, and `--ring` is `#8cc63f` — the token
          globals.css documents at 2.05:1 — so at half alpha the indicator sat
          near 1.4:1. Every button and link on this page rings at 4.97:1; the
          focus outline was disappearing precisely on the text fields. */}
      <Input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`bg-canvas border-sage-edge text-charcoal placeholder:text-slate ${FOCUS_RING} ${className ?? ''}`}
        {...inputProps}
      />
      {note && (
        <p id={noteId} className="text-[11px] text-slate">
          {note}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[11px] font-medium text-tomato-ink">
          {error}
        </p>
      )}
    </div>
  );
});
