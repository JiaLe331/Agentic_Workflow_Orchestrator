import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
  },
  async rewrites() {
    return [
      {
        source: '/generate-workflow',
        destination: 'http://localhost:8000/generate-workflow',
      },
      {
        source: '/trigger-workflow',
        destination: 'http://localhost:8000/api/trigger-workflow',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/:path*',
      },
      {
        source: '/workflows',
        destination: 'http://localhost:4000/workflows',
      },
      {
        source: '/workflows/:id',
        destination: 'http://localhost:4000/workflows/:id',
      },
    ];
  },
};

export default nextConfig;
