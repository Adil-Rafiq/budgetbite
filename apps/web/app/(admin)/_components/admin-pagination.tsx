'use client';

import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';

/**
 * Paging for the admin's list pages.
 *
 * This block was copied byte-for-byte into six files, which is how six copies
 * of the same two defects shipped:
 *
 * 1. Nothing announced the result change. A screen-reader user pressed Next
 *    and heard silence; the visible "Page 2 of 5" was not a live region, so
 *    the only feedback that the table had changed was visual.
 * 2. Pressing Next onto the final page sets `disabled` on the very button
 *    holding focus. The browser drops focus to `<body>`, so the user is
 *    silently returned to the top of the document — at exactly the moment
 *    they were told nothing had happened.
 *
 * Both are fixed once here: the status is `aria-live`, and when the control
 * you just used becomes disabled, focus steps to its still-enabled sibling
 * rather than evaporating.
 */
export function AdminPagination({
  page,
  pageCount,
  onPrevious,
  onNext,
  /** Plural noun for the announcement, e.g. "restaurants". */
  itemLabel = 'results',
}: {
  page: number;
  pageCount: number;
  onPrevious: () => void;
  onNext: () => void;
  itemLabel?: string;
}) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const atStart = page <= 1;
  const atEnd = page >= pageCount;

  useEffect(() => {
    const active = document.activeElement;
    if (atEnd && active === nextRef.current && !prevRef.current?.disabled) {
      prevRef.current?.focus();
    } else if (atStart && active === prevRef.current && !nextRef.current?.disabled) {
      nextRef.current?.focus();
    }
  }, [atStart, atEnd]);

  return (
    <div className="mt-4 flex items-center justify-between">
      <span
        role="status"
        aria-live="polite"
        className="font-mono text-[12px] tabular-nums text-slate-muted"
      >
        Page {page} of {pageCount}
        <span className="sr-only"> of {itemLabel}</span>
      </span>
      <div className="flex gap-2">
        <Button ref={prevRef} variant="outline" size="sm" disabled={atStart} onClick={onPrevious}>
          Previous
        </Button>
        <Button ref={nextRef} variant="outline" size="sm" disabled={atEnd} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
