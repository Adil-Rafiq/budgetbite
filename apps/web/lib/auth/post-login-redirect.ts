import { userApi } from '@/lib/api/endpoints/user';

export async function getPostLoginPath(): Promise<'/dashboard' | '/onboarding'> {
  try {
    const me = await userApi.get();
    if (me.profile?.latitude == null || me.profile?.longitude == null) {
      return '/onboarding';
    }
    return '/dashboard';
  } catch {
    return '/onboarding';
  }
}
