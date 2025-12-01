/** @type {import('next').NextConfig} */
const backendOrigin = (process.env.BACKEND_API_ORIGIN || 'http://localhost:8080').replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
