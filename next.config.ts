// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output pro Docker deployment
  output: "standalone",
  
  // Explicitně vypneme lomítka na konci URL.
  // To zabrání smyčkám typu /sluzby/ -> /sluzby
  trailingSlash: false, 
  
  // Doporučení pro Next.js + Sanity obrázky (pokud používáš)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
    unoptimized: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
