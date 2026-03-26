/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@lms/ui', '@lms/shared'],
};

export default nextConfig;
