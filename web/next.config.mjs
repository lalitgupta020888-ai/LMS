/** @type {import('next').NextConfig} */

// The Express/SQLite backend. Override with BACKEND_URL for other environments.
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
