'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const MUTED = '#71716a';

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      const { data: session } = await authClient.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      if (!session.user.latitude || !session.user.longitude) {
        router.push('/onboarding');
        return;
      }

      router.push('/dashboard');
    };

    checkOnboarding();
  }, [router]);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: LUMEN, color: VAST }}
    >
      <div
        className="flex flex-col items-center gap-4 rounded-2xl px-8 py-6"
        style={{ background: '#ffffff', border: `1px solid ${LUMEN_DK}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 animate-pulse rounded-full"
            style={{ background: FATHOM }}
          />
          <span
            className="text-[11px] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
          >
            signing in
          </span>
        </div>
        <p
          className="text-[14px]"
          style={{ color: MUTED, fontFamily: 'var(--font-mono)' }}
        >
          completing handshake…
        </p>
      </div>
    </div>
  );
}
