import type { SuggestionOption } from '@repo/shared';

/**
 * Human-readable title for a suggestion option. Options are whole orders that
 * can combine several menu items — "Zinger Burger + Fries + Drink" — so every
 * surface that used to print a single item name renders this instead.
 */
export function optionLabel(option: SuggestionOption): string {
  const names = option.items.map((i) => i.menuItemName ?? '—');
  return names.length > 0 ? names.join(' + ') : '—';
}

/** True when the option is a multi-item combo (worth a per-item breakdown). */
export function isCombo(option: SuggestionOption): boolean {
  return option.items.length > 1;
}
