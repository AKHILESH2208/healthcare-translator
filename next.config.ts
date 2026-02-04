import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'naomedical.com',
        pathname: '/main-page-assets/**',
      },
    ],
  },
};

export default nextConfig;
