import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    // D1 rename: old student bookmarks keep working.
    return [
      {
        source: "/student/:path*",
        destination: "/developer/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
