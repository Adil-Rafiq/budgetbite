'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

import { FOCUS_RING } from '@/lib/focus-ring';

interface DietaryTagPickerProps {
  label: string;
  hint: string;
  quickOptions: readonly string[];
  selected: string[];
  error?: string;
  onToggle: (tag: string) => void;
  onAdd: (tag: string) => void;
}

/**
 * Toggleable tag chips (quick-pick options + user-added custom tags) with a
 * free-text "add your own" input. Used for dietary preferences and allergens
 * in onboarding and on the profile page.
 */
export const DietaryTagPicker = ({
  label,
  hint,
  quickOptions,
  selected,
  error,
  onToggle,
  onAdd,
}: DietaryTagPickerProps) => {
  const [draft, setDraft] = useState('');
  // Quick options first, then any custom tags the user added.
  const customTags = selected.filter((tag) => !quickOptions.includes(tag));

  const handleAdd = () => {
    onAdd(draft);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate">{label}</span>
        <p className="text-xs text-slate">{hint}</p>
      </div>

      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {[...quickOptions, ...customTags].map((tag) => {
          const checked = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => onToggle(tag)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-[13px] capitalize transition-colors ${FOCUS_RING} ${
                checked
                  ? 'border-teal-deep bg-teal/10 font-semibold text-charcoal'
                  : 'border-sand bg-white font-normal text-slate hover:border-teal-deep/50'
              }`}
            >
              <span
                aria-hidden
                className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                  checked ? 'border-teal-deep bg-teal-deep text-white' : 'border-sand bg-white'
                }`}
              >
                {checked && <Check className="h-2.5 w-2.5" />}
              </span>
              {tag}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          maxLength={60}
          placeholder="Add your own…"
          aria-label={`Add a custom ${label.toLowerCase()} entry`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleAdd();
            }
          }}
          className={`min-h-11 w-full rounded-xl border border-sand bg-white px-3.5 py-2 text-[13px] text-charcoal transition-colors placeholder:text-slate/50 focus:border-teal-deep ${FOCUS_RING}`}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={draft.trim().length === 0}
          className={`min-h-11 rounded-xl border border-sand bg-canvas px-4 py-2 text-[13px] font-medium text-charcoal transition-colors hover:border-teal-deep disabled:opacity-40 disabled:hover:border-sand ${FOCUS_RING}`}
        >
          Add
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-tomato-ink">
          {error}
        </p>
      )}
    </div>
  );
};
