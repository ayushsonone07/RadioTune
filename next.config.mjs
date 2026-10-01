/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ggpht.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.youtube.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.gstatic.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
  return [
    {
      source: '/yt-proxy/:path*',
      destination: 'https://www.youtube.com/:path*',
    },
    {
      source: '/yt-music-proxy/:path*',
      destination: 'https://music.youtube.com/:path*',
    },
    ];
  },
};

export default nextConfig;
