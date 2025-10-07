/* eslint-disable @typescript-eslint/no-var-requires */
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (cfg) => cfg;

/** @type {import('next').NextConfig} */
const baseConfig = {
  // Keep type checks and linting during build; adjust if needed
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  images: {
    // Allow external images used in the app
    domains: [
      'images.pexels.com',
      'images.unsplash.com',
      'cdn.pixabay.com',
      'source.unsplash.com'
    ],
    // Disable optimizer to avoid server-side fetch timeouts for remote images
    unoptimized: true,
    // Explicitly allow image sources
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
    ],
  },
  // Reduce JS by rewriting library imports to per-module files at build time
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
};

module.exports = withBundleAnalyzer(baseConfig);
