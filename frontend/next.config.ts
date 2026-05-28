import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Forces Next.js to generate static files
  images: {
    unoptimized: true, // Required for static export images
  },
};

export default nextConfig;
