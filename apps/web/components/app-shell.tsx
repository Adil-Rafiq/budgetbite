'use client';

import { Inter, JetBrains_Mono, Bricolage_Grotesque } from 'next/font/google';
import { AppSidebar } from '@/components/app-sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { AppHeader } from '@/components/app-header';

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz'],
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${body.variable} ${display.variable} ${mono.variable} min-h-screen bg-lumen text-vast antialiased`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <AppSidebar />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <AppHeader />
        <main className="flex-1 p-4 pb-24 lg:p-8 lg:pb-10">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
