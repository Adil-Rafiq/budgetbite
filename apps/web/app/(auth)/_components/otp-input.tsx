'use client';

import { useImperativeHandle, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { OTP_LENGTH } from '@repo/shared';

/**
 * The six-cell code entry, shared by email verification and password reset.
 *
 * Split cells are a presentation choice that a screen reader should not have to
 * live with, so the whole thing reports as one labelled group with one
 * description; the caller supplies the id of the line that carries both the
 * expiry note and any rejection, and it is announced for every cell.
 *
 * The keyboard handling is the reason this is a component rather than six
 * inputs: arrow keys move between cells, Backspace on an empty cell steps back
 * and clears the previous one, and a pasted code is spread across cells from
 * wherever it lands. Only the first cell claims `autocomplete="one-time-code"`
 * — repeating it would invite the OS to fill all six with the same digit.
 */

export interface OtpInputHandle {
  focusFirst: () => void;
}

export function OtpInput({
  value,
  onChange,
  disabled = false,
  invalid = false,
  describedBy,
  label,
  ref,
}: {
  /** Exactly `OTP_LENGTH` entries; '' for an empty cell. */
  value: string[];
  /** Called with the next cell array. Fires on every keystroke and paste. */
  onChange: (next: string[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** Id of the status line describing the group. */
  describedBy?: string;
  label: string;
  ref?: React.Ref<OtpInputHandle>;
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const focusCell = (index: number) => {
    const clamped = Math.max(0, Math.min(OTP_LENGTH - 1, index));
    inputsRef.current[clamped]?.focus();
    inputsRef.current[clamped]?.select();
  };

  useImperativeHandle(ref, () => ({ focusFirst: () => focusCell(0) }), []);

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const next = [...value];

    if (!digits) {
      // Clearing the cell (selecting and deleting, or a non-digit keystroke).
      next[index] = '';
      onChange(next);
      return;
    }

    // Spread across cells when several digits arrive at once — autofill of a
    // one-time code delivers the whole thing to whichever cell has focus.
    for (let i = 0; i < digits.length && index + i < OTP_LENGTH; i++) {
      next[index + i] = digits[i]!;
    }
    onChange(next);
    focusCell(index + digits.length);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const next = [...value];
      if (next[index]) {
        next[index] = '';
        onChange(next);
      } else if (index > 0) {
        next[index - 1] = '';
        onChange(next);
        focusCell(index - 1);
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusCell(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusCell(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = Array<string>(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]!;
    onChange(next);
    focusCell(pasted.length);
  };

  return (
    <div
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
      className="flex items-center justify-center gap-2 sm:gap-2.5"
    >
      {value.map((digit, i) => (
        <div key={i} className="flex items-center gap-2 sm:gap-2.5">
          <input
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={OTP_LENGTH}
            aria-label={`Digit ${i + 1}`}
            aria-invalid={invalid ? true : undefined}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`h-14 w-11 rounded-xl border-2 text-center text-2xl font-bold tabular-nums outline-none transition-all sm:h-16 sm:w-12 ${
              invalid
                ? 'border-tomato/60 bg-tomato/5 text-tomato-ink'
                : digit
                  ? 'border-teal/50 bg-surface text-charcoal'
                  : 'border-sand bg-canvas text-charcoal'
            } focus:border-teal-ink focus:bg-surface focus:ring-4 focus:ring-teal-ink/25 disabled:opacity-60`}
          />
          {/* subtle 3-3 grouping divider */}
          {i === 2 && <span aria-hidden className="h-0.5 w-2 rounded-full bg-sand" />}
        </div>
      ))}
    </div>
  );
}
