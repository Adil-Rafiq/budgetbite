'use client';

import { useEffect, useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatHourLabel, formatTimeOfDay } from '@/lib/time';

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

/**
 * Minutes in 5-minute steps rather than all 60. A reminder does not need
 * minute precision, and flicking a 60-row column one-handed is exactly the
 * interaction a distracted mobile user gives up on. An off-grid value that is
 * already stored (from an earlier build, or an admin edit) is spliced back in
 * so switching hours can never silently round someone's time.
 */
const MINUTE_STEP = 5;
const BASE_MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, i) =>
  (i * MINUTE_STEP).toString().padStart(2, '0'),
);

const minuteOptions = (current: string): string[] =>
  BASE_MINUTES.includes(current)
    ? BASE_MINUTES
    : [...BASE_MINUTES, current].sort((a, b) => Number(a) - Number(b));

const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

const parse = (value: string): [string, string] => {
  const match = TIME_PATTERN.exec(value);
  if (!match) return ['00', '00'];
  return [match[1]!, match[2]!];
};

type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
  /** Marks the trigger invalid so a rejected time is announced, not just red. */
  'aria-invalid'?: boolean;
};

export function TimePicker({
  value,
  onChange,
  disabled,
  size = 'md',
  className,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
}: TimePickerProps) {
  const [hh, mm] = parse(value);
  const [open, setOpen] = useState(false);

  const setHour = (h: string) => onChange(`${h}:${mm}`);
  const setMinute = (m: string) => onChange(`${hh}:${m}`);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel ?? `Time, ${formatTimeOfDay(value)}`}
          aria-invalid={ariaInvalid}
          className={cn(
            'inline-flex items-center justify-between gap-2 rounded-xl border bg-surface outline-none transition',
            'focus-visible:border-teal-ink focus-visible:ring-2 focus-visible:ring-teal-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
            'data-[state=open]:border-teal-ink data-[state=open]:ring-2 data-[state=open]:ring-teal-ink/40',
            'disabled:cursor-not-allowed',
            disabled
              ? 'border-sand/60 text-slate/50 line-through'
              : ariaInvalid
                ? 'border-tomato text-charcoal hover:border-tomato'
                : 'border-sand text-charcoal hover:border-teal-ink/50',
            size === 'sm'
              ? 'min-h-9 w-[112px] px-2.5 py-1.5 text-[12px]'
              : 'min-h-11 w-[136px] px-3.5 py-2.5 text-[14px]',
            className,
          )}
        >
          <span className="tabular-nums">{formatTimeOfDay(value)}</span>
          <Clock className={cn('shrink-0 opacity-60', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        </button>
      </PopoverPrimitive.Trigger>

      {/*
        Intentionally NOT wrapped in PopoverPrimitive.Portal so the content
        renders inside its parent DOM subtree. When this picker is used inside
        a Radix Dialog, react-remove-scroll prevents wheel events that don't
        originate from inside the dialog's tree — portaling to <body> would
        break scrolling of the hour/minute columns.
      */}
      <PopoverPrimitive.Content
        align="end"
        sideOffset={6}
        className={cn(
          'z-50 w-auto origin-(--radix-popover-content-transform-origin) overflow-hidden rounded-xl border border-sand bg-surface p-0 shadow-[0_10px_28px_rgba(0,0,0,0.10)] outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        )}
      >
        <div className="flex items-baseline justify-center gap-1 border-b border-sand bg-canvas px-5 py-3 text-[22px] tabular-nums text-charcoal">
          {formatTimeOfDay(`${hh}:${mm}`)}
        </div>
        <div className="flex">
          <TimeColumn
            label="Hour"
            items={HOURS}
            selected={hh}
            onSelect={setHour}
            open={open}
            renderItem={formatHourLabel}
            width="w-[86px]"
          />
          <div className="w-px bg-sand" />
          <TimeColumn
            label="Min"
            items={minuteOptions(mm)}
            selected={mm}
            onSelect={setMinute}
            open={open}
          />
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}

type TimeColumnProps = {
  label: string;
  items: string[];
  selected: string;
  onSelect: (value: string) => void;
  open: boolean;
  /** Display transform — the stored value stays 24-hour either way. */
  renderItem?: (value: string) => string;
  width?: string;
};

function TimeColumn({
  label,
  items,
  selected,
  onSelect,
  open,
  renderItem,
  width = 'w-[68px]',
}: TimeColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Center the selected row whenever the popover opens or the value changes.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      selectedRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
    });
    return () => cancelAnimationFrame(id);
  }, [open, selected]);

  return (
    <div className="flex flex-col">
      <div className="border-b border-sand px-3 py-1.5 text-center text-[10px] uppercase tracking-[0.18em] text-slate/60">
        {label}
      </div>
      <div
        ref={containerRef}
        role="listbox"
        aria-label={label}
        className={cn('scrollbar-thin h-44 overflow-y-auto py-1', width)}
      >
        {items.map((v) => {
          const isSelected = selected === v;
          return (
            <button
              key={v}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(v)}
              className={cn(
                'flex h-9 w-full items-center justify-center text-[13px] tabular-nums transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-ink',
                isSelected
                  ? 'bg-teal-deep text-white'
                  : 'text-charcoal hover:bg-sand/40 focus:bg-sand/40',
              )}
            >
              {renderItem ? renderItem(v) : v}
            </button>
          );
        })}
      </div>
    </div>
  );
}
