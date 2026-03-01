'use client';

import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
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
          success: [
            '!bg-popover',
            '!border-accent/40',
            '[&_[data-title]]:!text-accent',
            '[&_[data-description]]:!text-muted-foreground',
            '[&_[data-icon]>svg]:!text-accent',
            '[&_[data-icon]]:!bg-accent/10',
            '[&_[data-icon]]:!rounded-full',
            '[&_[data-icon]]:!p-0.5',
          ].join(' '),
          error: [
            '!bg-popover',
            '!border-destructive/40',
            '[&_[data-title]]:!text-destructive',
            '[&_[data-description]]:!text-muted-foreground',
            '[&_[data-icon]>svg]:!text-destructive',
            '[&_[data-icon]]:!bg-destructive/10',
            '[&_[data-icon]]:!rounded-full',
            '[&_[data-icon]]:!p-0.5',
          ].join(' '),
          warning: [
            '!bg-popover',
            '!border-primary/40',
            '[&_[data-title]]:!text-primary',
            '[&_[data-description]]:!text-muted-foreground',
            '[&_[data-icon]>svg]:!text-primary',
            '[&_[data-icon]]:!bg-primary/10',
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
