/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  // Remove assetPrefix for development, only use for production build
  ...(process.env.NODE_ENV === 'production' && { assetPrefix: './' }),
}

export default nextConfig
