import type { NextConfig } from 'next';

// STATIC_EXPORT=1 writes a static site (GitHub Pages). NEXT_PUBLIC_BASE_PATH serves it
// under a sub-path: assetPrefix covers _next/, lib/weather/public-url.ts covers public/.
// Not basePath: vinext 1.0.0-beta.5 prerenders without it and the export 404s.
const base = process.env.NEXT_PUBLIC_BASE_PATH;
const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT ? { output: 'export' as const } : {}),
  ...(base ? { assetPrefix: base } : {}),
};

export default nextConfig;
