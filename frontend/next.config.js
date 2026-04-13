/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:3001'}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
