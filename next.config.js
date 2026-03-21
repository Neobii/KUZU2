/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /** Native sharp binary — do not bundle for App Router / server */
  serverComponentsExternalPackages: ['sharp'],
}

module.exports = nextConfig
