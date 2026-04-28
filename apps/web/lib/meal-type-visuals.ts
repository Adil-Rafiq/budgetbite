import { Coffee, Sun, Moon, Utensils, type LucideIcon } from 'lucide-react';

/**
 * Shared icon + color treatment for meal-type slots, keyed by mealType.key
 * (lowercase). Used by both the dashboard meal-slots view and the plan
 * detail page's generation suggestions grid so the same breakfast/lunch/dinner
 * affordances render consistently.
 *
 * Unknown keys fall back to a neutral primary tone — preferable to omitting
 * the icon entirely for any future meal types we don't have a bespoke visual
 * for yet (e.g. snack, brunch).
 */

const slotIcons: Record<string, LucideIcon> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
};

const slotColors: Record<string, string> = {
  breakfast: 'text-chart-1 bg-chart-1/10',
  lunch: 'text-chart-4 bg-chart-4/10',
  dinner: 'text-chart-3 bg-chart-3/10',
};

const defaultIcon: LucideIcon = Utensils;
const defaultColors = 'text-primary bg-primary/10';

export interface MealTypeVisual {
  Icon: LucideIcon;
  /** Tailwind classes applying both `text-…` and `bg-…/10` tones. */
  colors: string;
}

export function getMealTypeVisual(mealTypeKey: string): MealTypeVisual {
  const key = mealTypeKey.toLowerCase();
  return {
    Icon: slotIcons[key] ?? defaultIcon,
    colors: slotColors[key] ?? defaultColors,
  };
}
