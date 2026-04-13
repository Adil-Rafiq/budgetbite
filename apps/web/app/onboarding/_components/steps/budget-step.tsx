'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';

export const BudgetStep = () => {
  const { steps } = useOnboardingContext();
  const { values, actions, errors, mealTypeOptions } = steps.budget;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Plan type</Label>
        <Select value={values.planType} onValueChange={actions.setPlanType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="budget">Total budget (PKR)</Label>
        <Input
          id="budget"
          type="number"
          min={1}
          value={values.totalBudget}
          onChange={(event) => actions.setTotalBudget(Number(event.target.value))}
        />
        {errors.totalBudget ? (
          <p className="text-destructive text-xs">{errors.totalBudget}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Meal types</Label>
        <div className="flex flex-wrap gap-3">
          {mealTypeOptions.map((type) => (
            <label key={type.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={values.selectedMealTypeIds.includes(type.id)}
                onCheckedChange={() => actions.toggleMealType(type.id)}
              />
              <span className="text-sm capitalize text-foreground">{type.label}</span>
            </label>
          ))}
        </div>
        {errors.mealTypeIds ? (
          <p className="text-destructive text-xs">{errors.mealTypeIds}</p>
        ) : null}
      </div>
      <div className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
        Meals per day is set to {values.mealsPerDay}, based on selected meal types.
      </div>
    </div>
  );
};
