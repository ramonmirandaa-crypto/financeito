/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features if needed
  experimental: {
    // None currently needed
  },
  
  // Configure for Replit environment
  devIndicators: {
    buildActivity: false
  },
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    compress: true,
  }),
}

module.exports = nextConfig