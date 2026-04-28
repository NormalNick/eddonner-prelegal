import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_OUTPUT === "export";
const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = isStaticExport
  ? {
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {
      images: { unoptimized: true },
      async rewrites() {
        return [
          { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
        ];
      },
    };

export default nextConfig;
