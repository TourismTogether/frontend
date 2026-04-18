import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    qualities: [75, 90],
  },
  /** Truy cập dev server qua IP mạng (VD: VirtualBox Host-Only) — cho phép HMR /_next/webpack-hmr */
  allowedDevOrigins: ["192.168.56.1"],
  turbopack: {
    /** Tránh chọn nhầm lockfile ở thư mục cha khi có nhiều package-lock.json */
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
