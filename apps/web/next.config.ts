import type { NextConfig } from 'next';

const apiUrl = process.env.API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  transpilePackages: ['@ruya/shared'],
  // Hides the floating "N" dev-tools button; it only exists in `next dev` anyway.
  devIndicators: false,
  // The browser talks to /api on the same origin, so the session cookie stays first-party.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
