/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",          // Static export for S3 hosting
  trailingSlash: true,       // Needed for S3 static routing
  images: {
    unoptimized: true,       // Required for static export
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
