/* eslint-disable @typescript-eslint/no-var-requires */
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (cfg) => cfg;

/** @type {import('next').NextConfig} */
const baseConfig = {
  // Keep type checks and linting during build; adjust if needed
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Enable compression
  compress: true,
  // Enable SWC minification
  swcMinify: true,
  images: {
    // Allow external images used in the app
    domains: [
      'images.pexels.com',
      'images.unsplash.com',
      'cdn.pixabay.com',
      'source.unsplash.com'
    ],
    // Enable image optimization with proper formats
    formats: ['image/webp', 'image/avif'],
    // Add image sizes for better optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
  // Skip problematic pages during static generation
  generateBuildId: async () => {
    return 'production-build'
  },
  // Output configuration for better compatibility
  output: 'standalone',
};

module.exports = withBundleAnalyzer(baseConfig);
