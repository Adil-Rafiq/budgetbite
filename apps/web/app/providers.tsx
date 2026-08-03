'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/get-query-client';
import { ApiWakeupBanner } from '@/components/api-wakeup-banner';
import { ThemeProvider } from '@/components/theme-provider';
import type * as React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    /* `defaultTheme="system"` rather than "light": someone who has told their
       OS they want dark has already answered this question, and asking again
       with a light flash is not a neutral default. `enableSystem` keeps that
       link live, so the app follows a mid-session OS switch until the user
       picks a side explicitly.

       `disableTransitionOnChange` suppresses the CSS transitions that would
       otherwise fire on every element at once when the class flips — without
       it, toggling looks like the page is buffering rather than switching. */
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <ApiWakeupBanner />
        {children}
        <ReactQueryDevtools />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
