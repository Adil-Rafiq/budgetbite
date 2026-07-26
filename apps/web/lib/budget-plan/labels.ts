import { formatPKR } from '@/lib/currency';

/**
 * A human name for a plan, derived rather than stored.
 *
 * Plans have no `name` column, so every card was titled "{planType} plan" and
 * every detail header identified itself with `plan.id.slice(0, 8)` — ten
 * monthly plans rendered ten identical headlines, and the only unique string a
 * user ever saw was a UUID fragment. The period a plan covers is already unique
 * and is what someone actually searches their memory for ("the one from July"),
 * so it becomes the title. Adding a real editable name later is a schema
 * change; this needs none and fixes the scanning problem today.
 */

const monthDay = (d: Date) => d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });

/** e.g. "July", "Jun 3 – Jun 9", "Dec 30 – Jan 5". */
export function planPeriodLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Budget plan';

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const spansWholeMonth =
    sameMonth &&
    start.getDate() === 1 &&
    end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();

  if (spansWholeMonth) return start.toLocaleDateString('en-PK', { month: 'long' });
  return `${monthDay(start)} – ${monthDay(end)}`;
}

/** The card/header title: the period, which is what distinguishes one plan from another. */
export function planTitle(plan: { startDate: string; endDate: string }): string {
  return planPeriodLabel(plan.startDate, plan.endDate);
}

/** Secondary line pairing the period with what it was worth, e.g. "Monthly · ₨ 45,000". */
export function planSubtitle(plan: { planType: string; totalBudget: number }): string {
  const period = plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1);
  return `${period} · ${formatPKR(plan.totalBudget)}`;
}
