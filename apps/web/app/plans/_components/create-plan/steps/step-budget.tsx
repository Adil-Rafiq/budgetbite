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
import { useCreatePlanContext } from '@/app/plans/_context/create-plan-context';

const labelClass = 'text-[10px] font-semibold uppercase tracking-[0.18em] text-slate/60';

export const StepBudgetDetails = () => {
  const { steps, mealTypes } = useCreatePlanContext();
  const { values, actions, errors, mealTypeOptions } = steps.budget;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className={labelClass}>Plan type</Label>
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
        <Label htmlFor="budget" className={labelClass}>
          Total budget (PKR)
        </Label>
        <Input
          id="budget"
          type="number"
          min={1}
          value={values.totalBudget}
          onChange={(event) => actions.setTotalBudget(Number(event.target.value))}
          className="font-display text-lg font-semibold text-charcoal"
        />
        {errors.totalBudget ? (
          <p className="text-[11px] text-tomato">{errors.totalBudget}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label className={labelClass}>Meal types</Label>

        {mealTypes.status === 'loading' && (
          <div className="flex flex-wrap gap-2" aria-busy="true" aria-label="Loading meal types">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[30px] w-20 animate-pulse rounded-full border border-sage bg-canvas"
              />
            ))}
          </div>
        )}

        {mealTypes.status === 'error' && (
          <div
            role="alert"
            className="flex flex-col items-start gap-2 rounded-lg border border-tomato/30 bg-tomato/5 p-3 text-[12px]"
          >
            <div className="font-medium text-tomato">Couldn&apos;t load meal types</div>
            <div className="text-[11px] text-slate">
              Check your connection and try again. If this keeps happening, please contact support.
            </div>
            <button
              type="button"
              onClick={mealTypes.refetch}
              className="text-[11px] font-medium text-green underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {mealTypes.status === 'empty' && (
          <div className="rounded-lg border border-sage bg-canvas p-3 text-[12px] text-charcoal">
            <div className="font-medium">No meal types available yet</div>
            <div className="mt-0.5 text-[11px] text-slate">
              An admin still needs to configure these. Please reach out to support so we can get you
              set up.
            </div>
          </div>
        )}

        {mealTypes.status === 'ready' && (
          <>
            <div className="flex flex-wrap gap-2">
              {mealTypeOptions.map((type) => {
                const checked = values.selectedMealTypeIds.includes(type.id);
                return (
                  <label
                    key={type.id}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                      checked
                        ? 'border-green bg-green text-white'
                        : 'border-sage bg-canvas text-slate hover:border-green/40'
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => actions.toggleMealType(type.id)}
                      className="hidden"
                    />
                    <span className="text-[12px] font-medium capitalize">{type.label}</span>
                  </label>
                );
              })}
            </div>
            {errors.mealTypeIds ? (
              <p className="text-[11px] text-tomato">{errors.mealTypeIds}</p>
            ) : null}
          </>
        )}
      </div>
      <div className="rounded-lg border border-sage bg-canvas p-3 text-[12px] text-slate">
        Meals/day = {values.mealsPerDay} · based on selected types
      </div>
    </div>
  );
};
