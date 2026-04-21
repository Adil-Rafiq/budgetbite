'use client';

import { PlansPageHeader } from '@/app/plans/_components/plans-page-header';
import PlansList from '@/app/plans/_components/plans-list';

export default function PlansPage() {
  return (
    <div className="flex flex-col gap-6">
      <PlansPageHeader />

      <PlansList />
    </div>
  );
}
