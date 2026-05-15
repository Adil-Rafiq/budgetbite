'use client';

import { useEffect, useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Clock } from 'lucide-react';

import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

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
};

export function TimePicker({
  value,
  onChange,
  disabled,
  size = 'md',
  className,
  'aria-label': ariaLabel,
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
          aria-label={ariaLabel ?? `Time, ${hh}:${mm}`}
          className={cn(
            'inline-flex items-center justify-between gap-2 rounded-[10px] border bg-white outline-none transition',
            'focus-visible:border-fathom/50 focus-visible:ring-2 focus-visible:ring-fathom/30',
            'data-[state=open]:border-fathom/50 data-[state=open]:ring-2 data-[state=open]:ring-fathom/30',
            'disabled:cursor-not-allowed',
            disabled
              ? 'border-lumen-dk/60 text-soft line-through'
              : 'border-lumen-dk text-vast hover:border-fathom/40',
            size === 'sm'
              ? 'w-[100px] px-2.5 py-1.5 text-[12px]'
              : 'w-[124px] px-3.5 py-2.5 text-[14px]',
            className,
          )}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span className="tabular-nums">{`${hh}:${mm}`}</span>
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
          'z-50 w-auto origin-(--radix-popover-content-transform-origin) overflow-hidden rounded-xl border border-lumen-dk bg-white p-0 shadow-[0_10px_28px_rgba(0,0,0,0.10)] outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        )}
      >
        <div
          className="flex items-baseline justify-center gap-1 border-b border-lumen-dk bg-lumen px-5 py-3 text-[22px] text-vast tabular-nums"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
        >
          <span>{hh}</span>
          <span className="text-soft">:</span>
          <span>{mm}</span>
        </div>
        <div className="flex">
          <TimeColumn label="Hour" items={HOURS} selected={hh} onSelect={setHour} open={open} />
          <div className="w-px bg-lumen-dk" />
          <TimeColumn label="Min" items={MINUTES} selected={mm} onSelect={setMinute} open={open} />
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
};

function TimeColumn({ label, items, selected, onSelect, open }: TimeColumnProps) {
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
      <div
        className="border-b border-lumen-dk px-3 py-1.5 text-center text-[10px] uppercase text-soft"
        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
      >
        {label}
      </div>
      <div
        ref={containerRef}
        role="listbox"
        aria-label={label}
        className="scrollbar-thin h-44 w-[68px] overflow-y-auto py-1"
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
                'flex h-8 w-full items-center justify-center text-[13px] tabular-nums transition-colors',
                isSelected
                  ? 'bg-fathom text-lumen'
                  : 'text-vast hover:bg-lumen-dk/40 focus:bg-lumen-dk/40',
              )}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}
