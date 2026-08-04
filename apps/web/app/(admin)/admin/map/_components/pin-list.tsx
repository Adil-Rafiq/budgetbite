'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import type { AdminMapPin } from '@repo/shared';

import { FOCUS_RING } from '@/lib/focus-ring';
import { humanizeName } from '@/lib/humanize-name';

/**
 * The map, as something you can operate without a mouse.
 *
 * This is not a redundant second copy of the pins — it is the keyboard and
 * screen-reader path *to* them, and it is why the markers themselves are not
 * focusable. Three hundred focusable markers would put three hundred tab stops
 * between the filter chips and everything below the map, and each one would
 * announce as an unlabelled button.
 *
 * A listbox with a roving `aria-activedescendant` instead: one tab stop, arrows
 * to browse, Enter to select. Arrowing deliberately does not move the map —
 * committing is a separate act, so scanning the list does not fling the view
 * around on every keypress.
 */
interface PinListProps {
  pins: AdminMapPin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  staleBefore: number;
  emptyMessage: string;
}

export function PinList({ pins, selectedId, onSelect, staleBefore, emptyMessage }: PinListProps) {
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Keep the cursor on the selected row when selection arrives from the map,
  // so picking a pin with the mouse and then reaching for the keyboard resumes
  // from where the eye already is rather than from the top of the list.
  useEffect(() => {
    if (!selectedId) return;
    const index = pins.findIndex((p) => p.id === selectedId);
    if (index >= 0) setActiveIndex(index);
  }, [selectedId, pins]);

  // A filter or a pan can shrink the list out from under the cursor.
  useEffect(() => {
    setActiveIndex((i) => (i >= pins.length ? pins.length - 1 : i));
  }, [pins.length]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const node = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const move = (delta: number) => {
    setActiveIndex((i) => {
      if (pins.length === 0) return -1;
      const next = i < 0 ? 0 : i + delta;
      return Math.min(pins.length - 1, Math.max(0, next));
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(-1);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(pins.length > 0 ? 0 : -1);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(pins.length - 1);
        break;
      case 'Enter':
      case ' ': {
        const pin = pins[activeIndex];
        if (pin) {
          event.preventDefault();
          onSelect(pin.id);
        }
        break;
      }
      default:
        break;
    }
  };

  if (pins.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-center">
        <p className="text-[13px] leading-relaxed text-slate-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul
      ref={listRef}
      id={listId}
      role="listbox"
      aria-label="Restaurants in view"
      tabIndex={0}
      aria-activedescendant={activeIndex >= 0 ? `${listId}-${pins[activeIndex]?.id}` : undefined}
      onKeyDown={handleKeyDown}
      className={`min-h-0 flex-1 overflow-y-auto rounded-lg ${FOCUS_RING}`}
    >
      {pins.map((pin, index) => {
        const selected = pin.id === selectedId;
        const active = index === activeIndex;
        const isStale = new Date(pin.updatedAt).getTime() < staleBefore;

        return (
          <li
            key={pin.id}
            id={`${listId}-${pin.id}`}
            role="option"
            aria-selected={selected}
            onClick={() => {
              setActiveIndex(index);
              onSelect(pin.id);
            }}
            className={`flex cursor-pointer items-start gap-2.5 border-b border-sand/60 px-3 py-2.5 transition-colors last:border-b-0 ${
              selected ? 'bg-teal-tint' : active ? 'bg-canvas' : 'hover:bg-canvas'
            }`}
          >
            {/* Marks the row the arrow keys are on. Selection is the teal wash;
                this thinner bar is "where the cursor is", and without it
                arrowing through the list is silent to a sighted keyboard user
                who is not also running a screen reader. */}
            <span
              aria-hidden
              className={`mt-1 h-8 w-0.5 shrink-0 rounded-full ${
                active ? 'bg-teal-ink' : 'bg-transparent'
              }`}
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                {pin.isOutlier && (
                  <TriangleAlert aria-hidden className="h-3.5 w-3.5 shrink-0 text-tomato-ink" />
                )}
                <span
                  className={`truncate text-[13px] ${
                    selected ? 'font-semibold text-teal-ink' : 'font-medium text-charcoal'
                  }`}
                >
                  {humanizeName(pin.name)}
                </span>
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[11px] tabular-nums text-slate-muted">
                <span>
                  {pin.menuItemCount} {pin.menuItemCount === 1 ? 'item' : 'items'}
                </span>
                <span>{pin.rating != null ? `★ ${pin.rating.toFixed(1)}` : 'no rating'}</span>
                {pin.source === 'community' && <span>community</span>}
                {isStale && <span className="text-amber-ink">stale</span>}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
