/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Standalone output trims the deploy to only the files Next needs at runtime.
  // Required for efficient Railway deploys (no node_modules shipped).
  output: 'standalone',
  transpilePackages: ['@consecom/shared', '@consecom/ui', '@consecom/config'],
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  async rewrites() {
    // Server-side rewrites use the public URL. Browser calls hit /v1/* on this
    // origin and Next proxies them upstream.
    const apiUrl = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';
    return [
      { source: '/v1/:path*', destination: `${apiUrl}/v1/:path*` },
      { source: '/health', destination: `${apiUrl}/health` },
    ];
  },
};

export default config;