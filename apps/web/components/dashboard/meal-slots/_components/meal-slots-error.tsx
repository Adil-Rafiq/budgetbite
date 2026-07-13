import { TriangleAlert } from 'lucide-react';

export function MealSlotsError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-tomato/30 bg-tomato/[0.06] p-4 text-[13px] text-tomato">
      <TriangleAlert className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}
