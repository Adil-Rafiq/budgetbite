import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetApi } from '@/lib/api/budget.api';

export const useBudget = () => {
  return useQuery({
    queryKey: ['budget', 'active'],
    queryFn: budgetApi.getActive,
  });
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: budgetApi.create,
    onSuccess: () => {
      // invalidate so dashboard refetches
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });
};
