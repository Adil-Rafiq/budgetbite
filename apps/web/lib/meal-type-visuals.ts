import { Coffee, Sun, Moon, Utensils, type LucideIcon } from 'lucide-react';

/**
 * Shared icon treatment for meal-type slots, keyed by mealType.key (lowercase).
 * Used by the plan detail page's generation suggestions grid and its timeline
 * so the same breakfast/lunch/dinner affordances render consistently.
 *
 * Unknown keys fall back to a generic icon — preferable to omitting it entirely
 * for any future meal types we don't have a bespoke visual for yet (e.g. snack,
 * brunch).
 *
 * This used to carry a `colors` field as well — `text-chart-1/3/4` with a
 * matching `/10` tint. It was dead: both call sites destructure `Icon` and
 * nothing ever read `.colors`. It was also wrong twice over, which is why it
 * went rather than getting recoloured. As text on a white card `chart-4` was
 * about 2:1 and `chart-1` 4.17:1, both under the AA floor; and `chart-3`/
 * `chart-4` are tomato and amber, the two hues this design system reserves for
 * *spending health*. Meal type is categorical identity, so colouring lunch
 * amber would have put "close to budget" and "lunch" in the same paint — the
 * exact confusion the analytics page's ramp exists to avoid.
 *
 * If meal types ever do need colour, they want the single-hue category ramp
 * (see `CATEGORY_RAMP` in the analytics page), not the health palette.
 */

const slotIcons: Record<string, LucideIcon> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
};

const defaultIcon: LucideIcon = Utensils;

export interface MealTypeVisual {
  Icon: LucideIcon;
}

export function getMealTypeVisual(mealTypeKey: string): MealTypeVisual {
  return { Icon: slotIcons[mealTypeKey.toLowerCase()] ?? defaultIcon };
}
