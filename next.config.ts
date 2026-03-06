import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "bcrypt"],
};

export default nextConfig;
