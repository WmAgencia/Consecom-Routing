/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ['@consecom/shared', '@consecom/ui', '@consecom/config'],
  async rewrites() {
    const apiUrl = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';
    return [
      { source: '/v1/:path*', destination: `${apiUrl}/v1/:path*` },
      { source: '/health', destination: `${apiUrl}/health` },
    ];
  },
};

export default config;