import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Keep the Next.js badge off the narrow left sidebar (sign-out lives bottom-left).
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
