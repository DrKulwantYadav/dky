import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{
      source: "/free-thyroid-screening-bhiwadi",
      destination: "/thyroid-screening-bhiwadi",
      permanent: true,
    }];
  },
};

export default nextConfig;
