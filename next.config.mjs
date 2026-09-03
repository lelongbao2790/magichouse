import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectNodeModules = path.resolve(__dirname, 'node_modules');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Fix Windows + pnpm: pnpm sets NODE_PATH with semicolon-separated paths,
    // but enhanced-resolve treats each modules[] entry as a single directory path.
    // Split them and prepend the absolute project node_modules so CSS imports
    // (tailwindcss, tw-animate-css) are always resolvable.
    const existing = config.resolve?.modules ?? [];
    const split = existing.flatMap((m) =>
      typeof m === 'string' && m.includes(';') ? m.split(';') : [m]
    );
    config.resolve = {
      ...config.resolve,
      modules: [projectNodeModules, ...split.filter((m) => m !== projectNodeModules)],
    };
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    // Security headers are only enforced in production.
    // In development, webpack uses eval() for source maps which CSP would block,
    // preventing all client-side JavaScript from running (no event handlers attach).
    if (process.env.NODE_ENV !== 'production') return []
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co",
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
