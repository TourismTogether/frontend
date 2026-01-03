import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Allow cross-origin requests from specific origins in development
  allowedDevOrigins: ["192.168.56.1"],
};

export default nextConfig;
