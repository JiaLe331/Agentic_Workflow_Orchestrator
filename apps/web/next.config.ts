import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    reactCompiler: true,
  },
  async rewrites() {
    return [
      {
        source: '/generate-workflow',
        destination: 'http://localhost:8000/generate-workflow',
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
      {
        source: '/universal/:path*',
        destination: 'http://localhost:4000/universal/:path*',
      },
    ];
  },
};

export default nextConfig;
