import ky, { HTTPError } from 'ky';

export const apiClient = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include',
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error;
        if (response) {
          try {
            const body = await response.json<{ error?: string; message?: string }>();
            error.message = body.error ?? body.message ?? error.message;
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
