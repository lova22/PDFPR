import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  turbopack: {
    // Next.js mistakenly picks up the parent directory's lockfile as the root.
    // This causes Turbopack to index the entire user home directory, leading to OOM.
    // We explicitly set the root to the project directory to prevent this.
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
