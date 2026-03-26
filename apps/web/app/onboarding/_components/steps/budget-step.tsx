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

interface BudgetStepProps {
  planType: string;
  setPlanType: (value: string) => void;
  mealTypes: string[];
  toggleMealType: (type: string) => void;
}

export const BudgetStep = ({
  planType,
  setPlanType,
  mealTypes,
  toggleMealType,
}: BudgetStepProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-2">
      <Label>Plan type</Label>
      <Select value={planType} onValueChange={setPlanType}>
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
      <Input id="budget" type="number" placeholder="45000" defaultValue="45000" />
    </div>
    <div className="flex flex-col gap-2">
      <Label htmlFor="mealsPerDay">Meals per day (1-5)</Label>
      <Input id="mealsPerDay" type="number" min={1} max={5} defaultValue={3} />
    </div>
    <div className="flex flex-col gap-2">
      <Label>Meal types</Label>
      <div className="flex flex-wrap gap-3">
        {['breakfast', 'lunch', 'dinner'].map((type) => (
          <label key={type} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={mealTypes.includes(type)}
              onCheckedChange={() => toggleMealType(type)}
            />
            <span className="text-sm capitalize text-foreground">{type}</span>
          </label>
        ))}
      </div>
    </div>
  </div>
);
