import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
        config.resolve = config.resolve || {};
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
          stream: false,
          path: false,
          os: false,
        };
      }

      // Silence optional peer deps that are not installed
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        "pino-pretty": false,
        "@farcaster/miniapp-sdk": false,
        "@farcaster/miniapp-wagmi-connector": false,
        "@farcaster/mini-app-solana": false,
      };

      return config;
  },
  transpilePackages: [
    '@getpara/react-sdk',
    '@getpara/react-sdk-lite',
    '@getpara/web-sdk',
    '@getpara/core-sdk',
  ],
} as NextConfig;

export default nextConfig;
