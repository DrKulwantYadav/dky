import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }],
  },
  async headers() {
    return [{ source: "/email/unsubscribe", headers: [{ key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
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
