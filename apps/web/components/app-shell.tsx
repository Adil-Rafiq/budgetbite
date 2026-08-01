'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { AppHeader } from '@/components/app-header';
import { FOCUS_RING } from '@/lib/focus-ring';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-charcoal antialiased">
      {/* The shell had no skip link, so reaching page content by keyboard cost
          the wordmark plus five nav links on every single route change. Visible
          only on focus, and it must out-rank the header (z-40) and the rail
          (z-30) or it would land under them the moment it appears. */}
      <a
        href="#main-content"
        className={`sr-only z-50 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-xl focus:bg-green-deep focus:px-4 focus:text-sm focus:font-semibold focus:text-white ${FOCUS_RING}`}
      >
        Skip to content
      </a>
      <AppSidebar />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <AppHeader />
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 pb-24 lg:p-8 lg:pb-10">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
