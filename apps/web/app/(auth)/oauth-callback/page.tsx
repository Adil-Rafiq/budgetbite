'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      const { data: session } = await authClient.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // if no location set, user hasn't onboarded
      if (!session.user.latitude || !session.user.longitude) {
        router.push('/onboarding');
        return;
      }

      router.push('/dashboard');
    };

    checkOnboarding();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Signing you in...</p>
    </div>
  );
}
