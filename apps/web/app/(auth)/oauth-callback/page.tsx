'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="flex min-h-screen items-center justify-center bg-lumen px-4 text-vast">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-lumen-dk bg-white px-8 py-6">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-fathom" />
          <span
            className="text-[11px] uppercase text-fathom"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
          >
            signing in
          </span>
        </div>
        <p className="text-[14px] text-ink" style={{ fontFamily: 'var(--font-mono)' }}>
          completing handshake…
        </p>
      </div>
    </div>
  );
}
