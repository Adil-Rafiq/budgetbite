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

const labelClass = 'text-[10px] uppercase text-soft';
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.18em',
};

export const StepBudgetDetails = () => {
  const { steps } = useCreatePlanContext();
  const { values, actions, errors, mealTypeOptions } = steps.budget;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className={labelClass} style={labelStyle}>
          Plan type
        </Label>
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
        <Label htmlFor="budget" className={labelClass} style={labelStyle}>
          Total budget (PKR)
        </Label>
        <Input
          id="budget"
          type="number"
          min={1}
          value={values.totalBudget}
          onChange={(event) => actions.setTotalBudget(Number(event.target.value))}
          className="font-semibold text-vast"
          style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}
        />
        {errors.totalBudget ? (
          <p className="text-[11px] text-pulse" style={{ fontFamily: 'var(--font-mono)' }}>
            {errors.totalBudget}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label className={labelClass} style={labelStyle}>
          Meal types
        </Label>
        <div className="flex flex-wrap gap-2">
          {mealTypeOptions.map((type) => {
            const checked = values.selectedMealTypeIds.includes(type.id);
            return (
              <label
                key={type.id}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                  checked ? 'border-vast bg-vast text-lumen' : 'border-lumen-dk bg-lumen text-vast'
                }`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => actions.toggleMealType(type.id)}
                  className="hidden"
                />
                <span className="text-[12px] capitalize" style={{ fontFamily: 'var(--font-mono)' }}>
                  {type.label}
                </span>
              </label>
            );
          })}
        </div>
        {errors.mealTypeIds ? (
          <p className="text-[11px] text-pulse" style={{ fontFamily: 'var(--font-mono)' }}>
            {errors.mealTypeIds}
          </p>
        ) : null}
      </div>
      <div
        className="rounded-lg border border-lumen-dk bg-lumen p-3 text-[12px] text-ink"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        meals/day = {values.mealsPerDay} · based on selected types
      </div>
    </div>
  );
};
