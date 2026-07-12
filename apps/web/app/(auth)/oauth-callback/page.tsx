'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { getPostLoginPath } from '@/lib/auth/post-login-redirect';

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      const { data: session } = await authClient.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      router.push(await getPostLoginPath());
    };

    checkOnboarding();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 text-charcoal antialiased">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-sage bg-white px-8 py-7 shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green" />
          <span className="text-xs font-normal uppercase tracking-widest text-charcoal/70">
            Signing in
          </span>
        </div>
        <p className="flex items-center gap-2 text-sm text-slate">
          <Loader2 className="h-4 w-4 animate-spin text-green" />
          Completing handshake…
        </p>
      </div>
    </div>
  );
}
