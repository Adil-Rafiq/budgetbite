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
    <section className="flex flex-col rounded-2xl border border-lumen-dk bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <header className="mb-5 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fathom/[0.08] text-fathom">
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex min-w-0 flex-col">
          <h2
            className="text-vast"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h2>
          {hint && <p className="text-[12px] text-ink">{hint}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
