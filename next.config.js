/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features if needed
  experimental: {
    // None currently needed
  },
  
  // Configure dev server for Replit environment
  ...(process.env.NODE_ENV === 'development' && {
    devIndicators: {
      buildActivity: false
    },
    server: {
      host: '0.0.0.0',
      port: process.env.PORT || 5000,
    },
    // Allow all hosts for Replit proxy
    allowedHosts: 'all',
  }),
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    compress: true,
  }),
}

module.exports = nextConfig