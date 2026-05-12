const PULSE = '#7f1c34';

export function MealSlotsError({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-4 text-[13px]"
      style={{
        background: 'rgba(127,28,52,0.06)',
        border: `1px solid ${PULSE}33`,
        color: PULSE,
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)' }}>!</span>
      {message}
    </div>
  );
}
