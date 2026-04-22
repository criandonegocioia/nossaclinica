/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'drive.google.com'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. This is needed to prevent the interactive
    // prompt on Vercel from crashing the build.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
