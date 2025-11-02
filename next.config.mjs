/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Environment variables accessible on client side
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000',
  },
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Compression
  compress: true,
  
  // Image optimization
  images: {
    domains: ['localhost'],
  },
  
  // Rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? '/api/:path*'  // In production, handled by serverless function
          : 'http://localhost:3000/:path*',  // In development, proxy to Express server
      },
    ];
  },
  
  // Webpack configuration if needed
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
