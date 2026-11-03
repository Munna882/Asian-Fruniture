import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Required for Prisma with Next.js Server Components
  serverExternalPackages: ["@prisma/client", "prisma", "bcrypt"],
};

export default nextConfig;