export function MealSlotsError({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-sm">
      {message}
    </div>
  );
}
