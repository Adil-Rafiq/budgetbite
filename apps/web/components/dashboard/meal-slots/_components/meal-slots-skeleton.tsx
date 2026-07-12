export function MealSlotsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-sage bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-sage/70 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-xl bg-sage" />
              <div className="h-4 w-20 animate-pulse rounded bg-sage" />
            </div>
            <div className="h-4 w-14 animate-pulse rounded bg-sage" />
          </div>
          <div className="flex flex-1 flex-col gap-3 p-5">
            <div className="h-16 w-full animate-pulse rounded-xl bg-canvas" />
            <div className="h-16 w-full animate-pulse rounded-xl bg-canvas" />
            <div className="mt-auto h-9 w-full animate-pulse rounded-xl bg-canvas" />
          </div>
        </div>
      ))}
    </div>
  );
}
