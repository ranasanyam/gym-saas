// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "bcrypt"],
//   experimental: {
//     serverActions: {
//       bodySizeLimit: '2mb'
//     }
//   }
// };

// export default nextConfig;

// next.config.ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "bcryptjs",
  ],

  // Ensure service worker and manifest are served with correct headers
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control",   value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Content-Type",    value: "application/javascript" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type",    value: "application/manifest+json" },
          { key: "Cache-Control",   value: "public, max-age=3600" },
        ],
      },
      {
        // PWA icons — cache aggressively
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control",   value: "public, max-age=31536000, immutable" },
        ],
      },
    ]
  },
}

export default nextConfig
