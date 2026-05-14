/** @type {import('next').NextConfig} */

// When set, all /api/* requests hitting this Next.js app are proxied to the
// given origin. This is how we keep the browser talking to a single origin
// (the Vercel deployment) while the API actually lives on Render — required
// for the better-auth session cookie to be stored against the web origin so
// the middleware in `proxy.ts` can read it.
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, '');

const nextConfig = {
  ...(apiProxyTarget && {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: `${apiProxyTarget}/api/:path*`,
        },
      ];
    },
  }),
};

export default nextConfig;
