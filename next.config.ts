import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase: string): NextConfig => {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    distDir: "dist",
    ...(isDevelopment ? {} : { output: "export" as const }),
    productionBrowserSourceMaps: process.env.ENABLE_PRODUCTION_SOURCE_MAPS === "true",
    images: {
      unoptimized: true,
    },
    // API rewrites are available only to the development server.
    ...(isDevelopment ? {
      async rewrites() {
        const apiTarget = process.env.NEXT_PUBLIC_API_TARGET || "http://127.0.0.1:25774";
        return [
          {
            source: "/api/:path*",
            destination: `${apiTarget}/api/:path*`,
          },
          {
            source: "/themes/:path*",
            destination: `${apiTarget}/themes/:path*`,
          },
        ];
      },
    } : {}),
  };
};

export default nextConfig;
