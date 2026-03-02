import ky from 'ky';

export const apiClient = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include',
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error;
        if (response) {
          const body = await response.json<{ message: string }>();
          error.message = body.message;
        }
        return error;
      },
    ],
  },
});
