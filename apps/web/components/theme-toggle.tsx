'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Three choices, not two.
 *
 * A plain light/dark switch quietly drops the state most users are actually in
 * — "whatever my OS says" — and turns a preference that follows sunset into a
 * decision they have to remember to revisit. `system` is the default, so it has
 * to be reachable again after someone has picked a side; a two-way toggle makes
 * that a one-way door. Hence a radio group over an icon button that cycles: the
 * current state is readable without clicking, which a cycling button never is.
 */
const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
] as const;

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  /**
   * The server cannot know the theme — it lives in localStorage and the OS —
   * so the first client render must match the server's guess or React discards
   * the tree. Rendering a fixed placeholder until after mount is the standard
   * next-themes dance; `suppressHydrationWarning` on <html> covers the class
   * that the pre-hydration script writes, but not this component's own icon.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Reflects what is on screen, so the button shows a moon in dark mode whether
  // that came from an explicit choice or from the OS.
  const ActiveIcon = !mounted ? Sun : resolvedTheme === 'dark' ? Moon : Sun;

  const label = !mounted
    ? 'Theme'
    : theme === 'system'
      ? `Theme: following system (${resolvedTheme})`
      : `Theme: ${theme}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title="Theme"
          className={`inline-flex size-11 items-center justify-center rounded-full border border-sand bg-surface text-slate transition-colors hover:bg-canvas hover:text-charcoal active:scale-95 ${FOCUS_RING_ON_CANVAS} ${className}`}
        >
          <ActiveIcon className="h-4 w-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[168px]">
        <DropdownMenuRadioGroup
          // Before mount `theme` is undefined; falling back to `system` keeps
          // the group from flashing an unselected state on the real default.
          value={mounted ? (theme ?? 'system') : 'system'}
          onValueChange={setTheme}
        >
          {OPTIONS.map(({ value, label: optionLabel, Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="h-4 w-4" aria-hidden />
              {optionLabel}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
