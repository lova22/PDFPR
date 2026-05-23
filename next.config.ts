import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Next.js mistakenly picks up the parent directory's lockfile as the root.
    // This causes Turbopack to index the entire user home directory, leading to OOM.
    // We explicitly set the root to the project directory to prevent this.
    root: __dirname,
  },
};

export default nextConfig;
