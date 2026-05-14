import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

const pillVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-full font-medium select-none',
    'transition-all duration-150 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffeb]',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.97]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-[#1a1a1a] text-[#ffffeb] hover:bg-[#2a2a2a] hover:-translate-y-px hover:shadow-[0_6px_14px_rgba(0,0,0,0.18)] focus-visible:ring-[#1a1a1a]/40',
        accent:
          'bg-[#034f46] text-[#ffffeb] hover:bg-[#02403a] hover:-translate-y-px hover:shadow-[0_6px_14px_rgba(0,0,0,0.18)] focus-visible:ring-[#034f46]/40',
        outline:
          'border border-[#1a1a1a] bg-transparent text-[#1a1a1a] hover:bg-black/[0.04] hover:-translate-y-px focus-visible:ring-[#1a1a1a]/30',
        ghost:
          'border border-[#e4e4d0] bg-white text-[#1a1a1a] hover:bg-[#ffffeb] hover:border-[#cfcfb8] focus-visible:ring-[#1a1a1a]/20',
        subtle: 'bg-transparent text-[#1a1a1a] hover:bg-[#ffffeb] focus-visible:ring-[#1a1a1a]/20',
        danger:
          'border border-[#7f1c34] bg-white text-[#7f1c34] hover:bg-[#7f1c34]/[0.06] hover:-translate-y-px focus-visible:ring-[#7f1c34]/30',
      },
      size: {
        xs: 'px-3 py-1.5 text-[12px] gap-1.5',
        sm: 'px-4 py-2 text-[13px] gap-2',
        md: 'px-4 py-2.5 text-[13px] gap-2',
        lg: 'px-6 py-3 text-[14px] gap-2',
        iconSm: 'h-8 w-8 p-0 gap-0',
        iconMd: 'h-9 w-9 p-0 gap-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type PillVariant = NonNullable<VariantProps<typeof pillVariants>['variant']>;
export type PillSize = NonNullable<VariantProps<typeof pillVariants>['size']>;

export interface PillProps
  extends ComponentPropsWithoutRef<'button'>, VariantProps<typeof pillVariants> {
  asChild?: boolean;
}

export const Pill = forwardRef<HTMLButtonElement, PillProps>(function Pill(
  { className, variant, size, asChild = false, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(pillVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  );
});

export { pillVariants };
