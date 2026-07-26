import { formatPKR } from '@/lib/currency';

/**
 * "₨ 5,000 over" / "₨ 5,000 left" — never a clamp, never a bare minus sign.
 *
 * The plans list used to render `formatPKR(Math.max(0, remaining))`, so a user
 * who had spent ₨50,000 of a ₨45,000 budget was told they had **₨ 0 remaining**
 * while the sidebar beside it correctly said "over". The plan summary card did
 * not clamp but printed `₨ -5,000 … left` — a hyphen-width minus on a 32px
 * number followed by the word "left", which skims as "5,000 left".
 *
 * Budget adherence is the product, so the one number the product is about gets
 * one honest rendering: magnitude, then an explicit over/left word, then tone.
 * Screen readers get the same sentence, not a punctuation mark.
 */
export function RemainingAmount({
  remaining,
  size = 'md',
  className = '',
}: {
  remaining: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const isOver = remaining < 0;
  const amount = formatPKR(Math.abs(remaining));
  const word = isOver ? 'over' : 'left';

  const amountClass =
    size === 'lg'
      ? 'font-display text-[32px] font-semibold leading-tight tracking-tight tabular-nums'
      : size === 'md'
        ? 'font-display text-base font-semibold tabular-nums'
        : 'font-display text-sm font-semibold tabular-nums';

  const wordClass = size === 'lg' ? 'text-[13px]' : 'text-[11px]';

  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span className={`${amountClass} ${isOver ? 'text-tomato' : 'text-charcoal'}`}>{amount}</span>
      <span className={`${wordClass} font-medium ${isOver ? 'text-tomato' : 'text-slate'}`}>
        {word}
      </span>
    </span>
  );
}
