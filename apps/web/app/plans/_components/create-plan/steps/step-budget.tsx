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

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const PULSE = '#7f1c34';
const MUTED = '#71716a';
const SOFT = '#a6a691';

export const StepBudgetDetails = () => {
  const { steps } = useCreatePlanContext();
  const { values, actions, errors, mealTypeOptions } = steps.budget;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label
          className="text-[10px] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.18em' }}
        >
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
        <Label
          htmlFor="budget"
          className="text-[10px] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.18em' }}
        >
          Total budget (PKR)
        </Label>
        <Input
          id="budget"
          type="number"
          min={1}
          value={values.totalBudget}
          onChange={(event) => actions.setTotalBudget(Number(event.target.value))}
          style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: VAST }}
        />
        {errors.totalBudget ? (
          <p className="text-[11px]" style={{ color: PULSE, fontFamily: 'var(--font-mono)' }}>
            {errors.totalBudget}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label
          className="text-[10px] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.18em' }}
        >
          Meal types
        </Label>
        <div className="flex flex-wrap gap-2">
          {mealTypeOptions.map((type) => {
            const checked = values.selectedMealTypeIds.includes(type.id);
            return (
              <label
                key={type.id}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 transition"
                style={{
                  background: checked ? VAST : LUMEN,
                  color: checked ? LUMEN : VAST,
                  border: `1px solid ${checked ? VAST : LUMEN_DK}`,
                }}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => actions.toggleMealType(type.id)}
                  className="hidden"
                />
                <span
                  className="text-[12px] capitalize"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {type.label}
                </span>
              </label>
            );
          })}
        </div>
        {errors.mealTypeIds ? (
          <p className="text-[11px]" style={{ color: PULSE, fontFamily: 'var(--font-mono)' }}>
            {errors.mealTypeIds}
          </p>
        ) : null}
      </div>
      <div
        className="rounded-lg p-3 text-[12px]"
        style={{
          background: LUMEN,
          border: `1px solid ${LUMEN_DK}`,
          color: MUTED,
          fontFamily: 'var(--font-mono)',
        }}
      >
        meals/day = {values.mealsPerDay} · based on selected types
      </div>
    </div>
  );
};
