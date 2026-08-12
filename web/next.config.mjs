/** @type {import('next').NextConfig} */

// The API now lives in this app under app/api/** and talks to Postgres
// directly, so there is nothing left to proxy. Set DATABASE_URL to point it
// at a database — see README.md.
const nextConfig = {
  reactStrictMode: true,
}

export default nextConfig
