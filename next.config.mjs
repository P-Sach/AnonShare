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
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude backend native modules and their dependencies from webpack bundling
      config.externals.push({
        'bcrypt': 'commonjs bcrypt',
        '@mapbox/node-pre-gyp': 'commonjs @mapbox/node-pre-gyp',
        'express': 'commonjs express',
        'mongoose': 'commonjs mongoose',
        'ioredis': 'commonjs ioredis',
        'redis': 'commonjs redis',
        'multer': 'commonjs multer',
      });

      // Ignore problematic files
      config.resolve.alias = {
        ...config.resolve.alias,
        'mock-aws-s3': false,
        'aws-sdk': false,
        'nock': false,
      };

      // Handle HTML files that might be in node_modules
      config.module.rules.push({
        test: /\.html$/,
        use: 'ignore-loader',
      });
    }

    return config;
  },
};

export default nextConfig;
