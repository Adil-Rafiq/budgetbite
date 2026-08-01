'use client';

import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * One settings card.
 *
 * Two things it now carries that it didn't:
 *
 * 1. **A tone.** Location, dietary rules and favourites are not preferences —
 *    they are the constraints the planner is bound by, and changing one changes
 *    what the app can ever suggest. Rendering them at the same weight as "last
 *    name" told the user they cost the same. `planner` cards get the green
 *    tile; `account` cards get a neutral one.
 * 2. **A dirty flag.** Six independent forms on one page is the right pattern
 *    for settings, but it obliges the page to say which one is unsaved. Without
 *    that the user has to hold it in working memory, and the page was happy to
 *    throw the work away while they did.
 */
interface SectionProps {
  icon: LucideIcon;
  title: string;
  hint?: string;
  tone?: 'planner' | 'account';
  isDirty?: boolean;
  children: React.ReactNode;
}

export function Section({
  icon: Icon,
  title,
  hint,
  tone = 'account',
  isDirty = false,
  children,
}: SectionProps) {
  const headingId = useId();
  const isPlanner = tone === 'planner';

  return (
    // `role="group"`, not `<section>`. A named `<section>` is a region landmark,
    // so six cards produced six landmarks and a screen reader's landmark list
    // became a card inventory — while the three bands, which are the page's
    // actual structure, had none. The bands own the landmarks now.
    <div
      role="group"
      aria-labelledby={headingId}
      className={`flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition-colors ${
        isDirty ? 'border-amber/60' : 'border-sage'
      }`}
    >
      <header className="mb-5 flex items-start gap-3">
        <span
          aria-hidden
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            isPlanner ? 'bg-green-deep text-white' : 'bg-canvas text-slate'
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {/* h3, not h2: each card sits under one of the page's group
                headings, and a flat run of h2s would tell a screen reader the
                six cards are peers of "What the planner uses". */}
            <h3
              id={headingId}
              className="font-display text-[15px] font-semibold tracking-tight text-charcoal"
            >
              {title}
            </h3>
            {isDirty && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/50 bg-amber-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-ink">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-ink" />
                Unsaved
              </span>
            )}
          </div>
          {hint && <p className="text-[12px] text-slate">{hint}</p>}
        </div>
      </header>
      {children}
    </div>
  );
}
