import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  async rewrites() {
    const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
    const internalUrl = process.env.BACKEND_INTERNAL_URL;
    const isInternalLocal = !internalUrl || internalUrl.includes("localhost") || internalUrl.includes("127.0.0.1");

    const backendUrl = (
      (isProd && isInternalLocal
        ? process.env.PRODUCTION_BACKEND_URL || "https://crm-backend-ten-pi.vercel.app"
        : undefined) ||
      process.env.BACKEND_INTERNAL_URL ||
      process.env.PRODUCTION_BACKEND_URL ||
      (isProd ? "https://crm-backend-ten-pi.vercel.app" : "http://localhost:5000")
    ).replace(/\/$/, "");

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default function config(phase: string): NextConfig {
  return {
    ...nextConfig,
    // Keep production builds from overwriting a running dev server's chunks.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
