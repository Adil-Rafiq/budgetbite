export function MealSlotsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-lumen-dk bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]"
        >
          <div className="flex items-center justify-between border-b border-lumen-dk bg-lumen px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 animate-pulse rounded-full bg-lumen-dk" />
              <div className="h-4 w-20 animate-pulse rounded bg-lumen-dk" />
            </div>
            <div className="h-4 w-14 animate-pulse rounded bg-lumen-dk" />
          </div>
          <div className="flex flex-1 flex-col gap-3 p-5">
            <div className="h-16 w-full animate-pulse rounded-xl bg-lumen" />
            <div className="h-16 w-full animate-pulse rounded-xl bg-lumen" />
            <div className="mt-auto h-9 w-full animate-pulse rounded-full bg-lumen" />
          </div>
        </div>
      ))}
    </div>
  );
}
