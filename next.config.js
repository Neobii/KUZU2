/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    /** Native sharp binary — do not bundle for RSC / server routes */
    serverComponentsExternalPackages: ['sharp'],
  },
}

module.exports = nextConfig
