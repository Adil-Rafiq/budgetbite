import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LogoIcon } from '@/components/icons';
import { FOCUS_RING } from '@/lib/focus-ring';

/**
 * The chrome every signed-out screen wears: dotted canvas, wordmark, a way
 * back, and a narrow centred column.
 *
 * The sign-in, sign-up and verify screens each carry their own copy of this,
 * written before there were enough of them for the repetition to be obvious.
 * The reset flow adds two more screens, so it starts from one source instead —
 * the older three can adopt it whenever they are next opened.
 */
export function AuthShell({
  back,
  width = 440,
  children,
}: {
  /** Where the top-right escape hatch goes, and what it says. */
  back: { href: string; label: string };
  /** Column width in px; the sign-up form needs a little more room. */
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-canvas text-charcoal antialiased">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, var(--color-sand) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <header className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between px-6 py-6 sm:px-8">
        <Link
          href="/"
          aria-label="BudgetBite — go to home"
          className={`flex items-center gap-2.5 rounded-lg ${FOCUS_RING}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-deep text-white">
            <LogoIcon size={16} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Budget<span className="text-teal-ink">Bite</span>
          </span>
        </Link>
        <Link
          href={back.href}
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-slate transition-colors hover:text-charcoal ${FOCUS_RING}`}
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          {back.label}
        </Link>
      </header>

      <main
        style={{ maxWidth: width }}
        className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] w-full flex-col justify-center px-6 pb-16"
      >
        {children}
      </main>
    </div>
  );
}
