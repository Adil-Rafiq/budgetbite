import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

const pillVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-full font-medium select-none',
    'transition-all duration-150 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-lumen',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.97]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-vast text-lumen hover:bg-vast/85 hover:-translate-y-px hover:shadow-[0_6px_14px_rgba(0,0,0,0.18)] focus-visible:ring-vast/40',
        accent:
          'bg-fathom text-lumen hover:bg-fathom/90 hover:-translate-y-px hover:shadow-[0_6px_14px_rgba(0,0,0,0.18)] focus-visible:ring-fathom/40',
        outline:
          'border border-vast bg-transparent text-vast hover:bg-black/[0.04] hover:-translate-y-px focus-visible:ring-vast/30',
        ghost:
          'border border-lumen-dk bg-white text-vast hover:bg-lumen hover:border-soft focus-visible:ring-vast/20',
        subtle: 'bg-transparent text-vast hover:bg-lumen focus-visible:ring-vast/20',
        danger:
          'border border-pulse bg-white text-pulse hover:bg-pulse/[0.06] hover:-translate-y-px focus-visible:ring-pulse/30',
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
