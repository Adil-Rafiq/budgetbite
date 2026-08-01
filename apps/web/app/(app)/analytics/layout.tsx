import type { Metadata } from 'next';

/**
 * Metadata only — the shell comes from the `(app)` group layout above.
 *
 * The title said "Spending" while the rail said "Analytics" and the page eyebrow
 * said "Spend · Analytics": one destination with three names, so a browser tab,
 * a nav item and a page heading never quite agreed on where the user was.
 */
export const metadata: Metadata = {
  title: 'Analytics · BudgetBite',
  description: 'What you spent, how it tracked against your budget, and where it went.',
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
