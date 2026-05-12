export function MealSlotsError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-pulse/20 bg-pulse/[0.06] p-4 text-[13px] text-pulse">
      <span style={{ fontFamily: 'var(--font-mono)' }}>!</span>
      {message}
    </div>
  );
}
