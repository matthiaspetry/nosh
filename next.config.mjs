/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Allows all subdomains of supabase.co
      },
      // You can add other hostnames here if needed in the future
    ],
  },
};

// Use ES Module syntax for exporting
export default nextConfig;