import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }],
  },
  async redirects() {
    return [{
      source: "/free-thyroid-screening-bhiwadi",
      destination: "/thyroid-screening-bhiwadi",
      permanent: true,
    }];
  },
};

export default nextConfig;
