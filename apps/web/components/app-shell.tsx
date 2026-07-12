'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { AppHeader } from '@/components/app-header';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-charcoal antialiased">
      <AppSidebar />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <AppHeader />
        <main className="flex-1 p-4 pb-24 lg:p-8 lg:pb-10">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
