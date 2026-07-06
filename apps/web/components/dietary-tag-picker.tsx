'use client';

import { useState } from 'react';

const labelClass = 'text-[11px] uppercase text-ink';
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.16em',
};

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
        <label className={labelClass} style={labelStyle}>
          {label}
        </label>
        <p className="text-[12px] text-ink">{hint}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[...quickOptions, ...customTags].map((tag) => {
          const checked = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggle(tag)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] capitalize transition ${
                checked
                  ? 'border-fathom bg-fathom/8 font-medium text-fathom'
                  : 'border-lumen-dk bg-white font-normal text-vast'
              }`}
            >
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-lumen ${
                  checked ? 'bg-fathom' : 'bg-white'
                }`}
                style={{
                  border: `1.5px solid var(--color-${checked ? 'fathom' : 'lumen-dk'})`,
                  fontSize: 9,
                  lineHeight: 1,
                }}
              >
                {checked && '✓'}
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
          className="w-full rounded-[10px] border border-lumen-dk bg-white px-3.5 py-2 text-[13px] text-vast outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={draft.trim().length === 0}
          className="rounded-[10px] border border-lumen-dk bg-lumen px-4 py-2 text-[13px] font-medium text-vast transition disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {error && <p className="text-[11px] text-pulse">{error}</p>}
    </div>
  );
};
