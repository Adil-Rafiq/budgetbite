import type { Metadata } from 'next';

import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'Spending · BudgetBite',
  description: 'What you spent, how it tracked against your budget, and where it went.',
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
