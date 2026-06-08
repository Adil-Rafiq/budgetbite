'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { Spinner } from '@/components/ui/spinner';

/**
 * Client-side gate for the (admin) route group. UX only — it hides the admin UI
 * from non-admins and avoids a flash of content. The API enforces admin
 * permissions independently via requirePermission, so this is not the security
 * boundary. proxy.ts already redirects unauthenticated users to /login.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-6 text-soft" />
      </div>
    );
  }

  // Non-admins are being redirected; render nothing in the meantime.
  if (!isAdmin) return null;

  return <>{children}</>;
}
