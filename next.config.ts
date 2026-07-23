import path from "node:path";
import type { NextConfig } from "next";

const appRoot = path.join(__dirname);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Pin root to this app — a parent Deskk/pnpm-lock.yaml otherwise becomes the workspace root
  // and Next can hang at "Starting..." without ever becoming Ready.
  outputFileTracingRoot: appRoot,
  turbopack: {
    root: appRoot,
  },
  // Keep the Next.js badge off the narrow left sidebar (sign-out lives bottom-left).
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
