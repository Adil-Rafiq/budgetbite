const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const WHITE = '#ffffff';

export function MealSlotsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl"
          style={{
            background: WHITE,
            border: `1px solid ${LUMEN_DK}`,
            boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ background: LUMEN, borderBottom: `1px solid ${LUMEN_DK}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-7 w-7 animate-pulse rounded-full"
                style={{ background: LUMEN_DK }}
              />
              <div className="h-4 w-20 animate-pulse rounded" style={{ background: LUMEN_DK }} />
            </div>
            <div className="h-4 w-14 animate-pulse rounded" style={{ background: LUMEN_DK }} />
          </div>
          <div className="flex flex-1 flex-col gap-3 p-5">
            <div className="h-16 w-full animate-pulse rounded-xl" style={{ background: LUMEN }} />
            <div className="h-16 w-full animate-pulse rounded-xl" style={{ background: LUMEN }} />
            <div
              className="mt-auto h-9 w-full animate-pulse rounded-full"
              style={{ background: LUMEN }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
