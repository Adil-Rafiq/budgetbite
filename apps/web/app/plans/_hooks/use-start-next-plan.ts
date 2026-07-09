'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  useActiveBudgetPlan,
  useCancelBudgetPlan,
  useCreateBudgetPlan,
} from '@/hooks/use-budget-plan';
import { getPlanDateRange } from '@/app/plans/_hooks/use-create-plan';
import { showToast } from '@/lib/toast';
import { getErrorMessage, isPlanAlreadyActive } from '@/lib/api/errors';
import type { BudgetPlanDetail } from '@repo/shared';

/**
 * One-click "start next plan with same settings": reuses a finished plan's
 * planType/totalBudget/mealTypeIds/notificationTimes, recomputes fresh
 * startDate/endDate, and creates it — cancelling the caller's active plan
 * first if one exists (mirrors the replace flow in plans-page-header.tsx).
 */
export const useStartNextPlan = (source: BudgetPlanDetail) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: active } = useActiveBudgetPlan();
  const { mutateAsync: createBudgetPlan, isPending: isCreating } = useCreateBudgetPlan();
  const { mutateAsync: cancelBudgetPlan, isPending: isCancelling } = useCancelBudgetPlan();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const submit = async () => {
    try {
      if (active?.plan) {
        await cancelBudgetPlan(active.plan.id);
      }

      const mealTypeIds = source.mealTypes.map((mt) => mt.id);
      // The DB constraint requires notification_times to be either absent or
      // exactly mealsPerDay long. `[]` on the response can mean "no
      // notifications were ever set" (stored as NULL) as well as a genuine
      // mismatch — either way, forwarding it verbatim only makes sense when
      // its length still matches the new plan's meal count.
      const notificationTimes =
        source.notificationTimes?.length === mealTypeIds.length
          ? source.notificationTimes
          : undefined;
      const created = await createBudgetPlan({
        planType: source.planType,
        totalBudget: source.totalBudget,
        mealTypeIds,
        mealsPerDay: mealTypeIds.length,
        ...getPlanDateRange(source.planType),
        notificationTimes,
      });

      showToast.success({ title: 'New plan started!' });
      router.push(`/plans/${created.id}`);
    } catch (err) {
      const conflict = await isPlanAlreadyActive(err);
      if (conflict) {
        queryClient.invalidateQueries({ queryKey: ['activeBudgetPlan'] });
        queryClient.invalidateQueries({ queryKey: ['budgetPlans'] });
        showToast.error({
          title: 'Active plan detected',
          description: 'Another active plan already exists. Refresh and try again.',
        });
        return;
      }
      showToast.error({
        title: 'Failed to start next plan',
        description: getErrorMessage(err, 'Something went wrong. Please try again.'),
      });
    }
  };

  const start = () => {
    if (active?.plan) {
      setConfirmOpen(true);
      return;
    }
    void submit();
  };

  const confirmReplace = () => {
    setConfirmOpen(false);
    void submit();
  };

  return {
    start,
    confirmOpen,
    setConfirmOpen,
    confirmReplace,
    isPending: isCreating || isCancelling,
  };
};
