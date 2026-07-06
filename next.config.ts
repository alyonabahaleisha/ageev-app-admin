import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — the CMS is fully client-side (Firebase SDK in the browser),
  // deployed to Firebase Hosting from ./out.
  output: "export",
  images: {unoptimized: true},
};

export default nextConfig;
