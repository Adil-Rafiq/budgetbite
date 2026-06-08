import ky, { HTTPError } from 'ky';
import { markApiWakeupError, markApiWakeupFinish, markApiWakeupStart } from '@/lib/api/wakeup';

export const apiClient = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      () => {
        markApiWakeupStart();
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        markApiWakeupFinish();
        return response;
      },
    ],
    beforeError: [
      async (error) => {
        markApiWakeupError();

        const { response } = error;
        if (response) {
          try {
            const body = await response.json<{ error?: string; message?: string; code?: string }>();
            error.message = body.error ?? body.message ?? error.message;
            // Stash the API's machine-readable code so callers can branch on it
            // (e.g. NO_NEARBY_RESTAURANTS) without string-matching the message.
            if (body.code) (error as HTTPError & { code?: string }).code = body.code;
          } catch {
            // response wasn't JSON — keep the original error message
          }
        }
        return error;
      },
    ],
  },
});

export { HTTPError };
