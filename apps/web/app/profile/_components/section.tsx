'use client';

import type { LucideIcon } from 'lucide-react';

interface SectionProps {
  icon: LucideIcon;
  title: string;
  hint?: string;
  children: React.ReactNode;
}

export function Section({ icon: Icon, title, hint, children }: SectionProps) {
  return (
    <section className="flex flex-col rounded-2xl border border-sage bg-white p-6 shadow-sm">
      <header className="mb-5 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green/10 text-dark-green">
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex min-w-0 flex-col">
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-charcoal">
            {title}
          </h2>
          {hint && <p className="text-[12px] text-slate">{hint}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
