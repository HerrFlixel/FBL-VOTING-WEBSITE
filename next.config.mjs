/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },
  // Deaktiviere statische Generierung für Routen mit useSearchParams
  generateBuildId: async () => {
    return 'build-' + Date.now()
  }
}

export default nextConfig



