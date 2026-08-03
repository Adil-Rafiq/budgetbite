'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  /* Sonner keeps its own notion of the theme and writes it onto the toast
     container, where it drives the base colours the classNames below do not
     override. It was pinned to "light", which was true of the whole app until
     now; left pinned, every toast in dark mode would have arrived as a light
     slab. Passing next-themes' value straight through — including "system",
     which sonner resolves itself — keeps the two in step. */
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      gap={8}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast: [
            'group toast',
            '!bg-popover !text-popover-foreground',
            '!border !border-border',
            '!shadow-md !rounded-xl',
            '!px-4 !py-3',
            '!font-sans',
          ].join(' '),
          title: '!text-foreground !font-semibold !text-sm',
          description: '!text-muted-foreground !text-xs !mt-0.5',
          actionButton:
            '!bg-primary !text-primary-foreground !text-xs !font-medium !rounded-md !px-3 !py-1.5 hover:!opacity-90 !transition-opacity',
          cancelButton:
            '!bg-muted !text-muted-foreground !text-xs !font-medium !rounded-md !px-3 !py-1.5 hover:!opacity-90 !transition-opacity',
          closeButton:
            '!border-border !bg-popover !text-muted-foreground hover:!text-foreground !transition-colors',
          /* The three states use the same ink-on-tint pairs as
             `BUDGET_FIT_PILL`, so a success toast and a "Fits budget" pill are
             the same green-that-is-teal, and a warning toast matches "Tight".

             All three were off before, in different ways. Success was
             `emerald-600` — a hue from no palette at all, in an app that
             deliberately has no green, and 3.77:1 on a white popover. Warning
             was `primary`, i.e. the brand teal, so a warning was indistinguish-
             able from a success once success stopped being green — while
             `amber`, the token whose entire job is "caution", went unused.
             Error was `destructive`, the tomato *fill*: 4.96:1 on a white
             popover but 3.49:1 on a dark one, so the dark theme would have
             shipped sub-AA error titles.

             Measured on the popover in both themes: teal-ink 7.04/9.75,
             amber-ink 5.91/10.57, tomato-ink 7.31/8.43. The borders stay
             decorative — every toast carries an icon and a title, so hue is
             never the only signal. */
          success: [
            '!bg-popover',
            '!border-teal/40',
            '[&_[data-title]]:!text-teal-ink',
            '[&_[data-description]]:!text-muted-foreground',
            '[&_[data-icon]>svg]:!text-teal-ink',
            '[&_[data-icon]]:!bg-teal/10',
            '[&_[data-icon]]:!rounded-full',
            '[&_[data-icon]]:!p-0.5',
          ].join(' '),
          error: [
            '!bg-popover',
            '!border-tomato/40',
            '[&_[data-title]]:!text-tomato-ink',
            '[&_[data-description]]:!text-muted-foreground',
            '[&_[data-icon]>svg]:!text-tomato-ink',
            '[&_[data-icon]]:!bg-tomato/10',
            '[&_[data-icon]]:!rounded-full',
            '[&_[data-icon]]:!p-0.5',
          ].join(' '),
          warning: [
            '!bg-popover',
            '!border-amber/40',
            '[&_[data-title]]:!text-amber-ink',
            '[&_[data-description]]:!text-muted-foreground',
            '[&_[data-icon]>svg]:!text-amber-ink',
            '[&_[data-icon]]:!bg-amber/10',
            '[&_[data-icon]]:!rounded-full',
            '[&_[data-icon]]:!p-0.5',
          ].join(' '),
          info: [
            '!bg-popover',
            '!border-border',
            '[&_[data-title]]:!text-foreground',
            '[&_[data-description]]:!text-muted-foreground',
            '[&_[data-icon]>svg]:!text-muted-foreground',
            '[&_[data-icon]]:!bg-muted',
            '[&_[data-icon]]:!rounded-full',
            '[&_[data-icon]]:!p-0.5',
          ].join(' '),
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
