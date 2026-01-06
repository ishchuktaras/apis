// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  },
};

export default nextConfig;