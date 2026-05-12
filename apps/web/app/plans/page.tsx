'use client';

import { PlansPageHeader } from '@/app/plans/_components/plans-page-header';
import PlansList from '@/app/plans/_components/plans-list';
import { FadeUp } from '@/components/motion';

export default function PlansPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <FadeUp>
        <PlansPageHeader />
      </FadeUp>
      <FadeUp delay={0.1}>
        <PlansList />
      </FadeUp>
    </div>
  );
}
