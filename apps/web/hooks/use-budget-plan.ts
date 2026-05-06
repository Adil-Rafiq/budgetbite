import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetPlanApi } from '@/lib/api/endpoints/budget-plan';
import { orNull } from '@/lib/api/utils';
import { CreateBudgetPlanInput } from '@repo/shared';

// list of all budget plans
export const useBudgetPlans = (params: Parameters<typeof budgetPlanApi.list>[0]) =>
  useQuery({
    queryKey: ['budgetPlans', params],
    queryFn: () => budgetPlanApi.list(params),
  });

// get budget plan by id
//
// Polls every 2s while the latest generation attempt is still pending so the
// "regenerating…" UX state stays in sync with backend AI work without any
// manual refetch wiring at the call site. Once the attempt reaches a terminal
// state (succeeded / failed / superseded) polling stops automatically.
export const useBudgetPlanById = (id: string) =>
  useQuery({
    queryKey: ['budgetPlan', id],
    queryFn: () => budgetPlanApi.getById(id),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.latestAttempt?.status === 'pending' ? 2000 : false,
  });

// get active budget plan
export const useActiveBudgetPlan = () =>
  useQuery({
    queryKey: ['activeBudgetPlan'],
    queryFn: () => orNull(() => budgetPlanApi.getActive()),
  });

// create a new budget plan
export const useCreateBudgetPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBudgetPlanInput) => budgetPlanApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetPlans'] });
      queryClient.invalidateQueries({ queryKey: ['activeBudgetPlan'] });
    },
  });
};

// update a budget plan
export const useUpdateBudgetPlan = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof budgetPlanApi.update>[1]) =>
      budgetPlanApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetPlans'] });
      queryClient.invalidateQueries({ queryKey: ['activeBudgetPlan'] });
      queryClient.invalidateQueries({ queryKey: ['budgetPlan', id] });
    },
  });
};

// cancel a budget plan (soft-cancel; supersedes any pending generation)
export const useCancelBudgetPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetPlanApi.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['budgetPlans'] });
      queryClient.invalidateQueries({ queryKey: ['activeBudgetPlan'] });
      queryClient.invalidateQueries({ queryKey: ['budgetPlan', id] });
    },
  });
};

// get budget plan context
export const useBudgetPlanContext = (id: string) =>
  useQuery({
    queryKey: ['budgetPlanContext', id],
    queryFn: () => budgetPlanApi.getContext(id),
    enabled: !!id,
  });

// Paginated generation history for a plan, newest-first.
//
// Polls every 2s while any item on the *current page* is `pending` so the
// detail timeline animates in lockstep with backend AI work. Once everything
// settles into a terminal status (succeeded / failed / superseded) polling
// stops automatically.
const DEFAULT_GENERATIONS_PARAMS = { limit: 20, offset: 0 } as const;
export const useBudgetPlanGenerations = (
  planId: string,
  params: { limit: number; offset: number } = DEFAULT_GENERATIONS_PARAMS,
) =>
  useQuery({
    queryKey: ['budgetPlanGenerations', planId, params],
    queryFn: () => budgetPlanApi.listGenerations(planId, params),
    enabled: !!planId,
    refetchInterval: (query) =>
      query.state.data?.data.some((g) => g.status === 'pending') ? 2000 : false,
  });

// Lazy-load the suggestions for a single generation. Succeeded generation
// rows are immutable so we cache aggressively (60s) — the main reason to
// invalidate is when an attempt with the same id transitions states (which
// can't happen for `succeeded`).
export const useBudgetPlanGenerationDetail = (planId: string, gid: string | null) =>
  useQuery({
    queryKey: ['budgetPlanGeneration', planId, gid],
    queryFn: () => budgetPlanApi.getGeneration(planId, gid!),
    enabled: !!planId && !!gid,
    staleTime: 60_000,
  });

// Pin/choice/suggestion-merged timeline across the plan's full date range.
// Invalidated by the meal-pin and meal-choice hooks (see those files) so the
// view reflects user actions immediately. Polls while a fresh generation is
// pending so newly succeeded suggestions land in the timeline without a hard
// reload.
export const usePlanTimeline = (planId: string, isPendingGeneration: boolean = false) =>
  useQuery({
    queryKey: ['planTimeline', planId],
    queryFn: () => budgetPlanApi.getTimeline(planId),
    enabled: !!planId,
    refetchInterval: isPendingGeneration ? 2000 : false,
  });
