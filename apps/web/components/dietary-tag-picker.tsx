'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

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

      <div className="flex flex-wrap gap-2">
        {[...quickOptions, ...customTags].map((tag) => {
          const checked = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggle(tag)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] capitalize transition-colors ${
                checked
                  ? 'border-green bg-green/5 font-semibold text-charcoal'
                  : 'border-sage bg-white font-normal text-slate hover:border-green/40'
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                  checked ? 'border-green bg-green text-white' : 'border-sage bg-white'
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
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleAdd();
            }
          }}
          className="w-full rounded-xl border border-sage bg-white px-3.5 py-2 text-[13px] text-charcoal outline-none transition-colors placeholder:text-slate/50 focus:border-green"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={draft.trim().length === 0}
          className="rounded-xl border border-sage bg-canvas px-4 py-2 text-[13px] font-medium text-charcoal transition-colors hover:border-green disabled:opacity-40 disabled:hover:border-sage"
        >
          Add
        </button>
      </div>

      {error && <p className="text-xs text-tomato">{error}</p>}
    </div>
  );
};
