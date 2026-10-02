import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
// Google Analytics: the gtag script, and the hosts it reports to. It only loads after consent.
const GA_SCRIPT = " https://www.googletagmanager.com";
const GA_CONNECT = " https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com";

// Preview deployments carry Vercel's feedback toolbar; production does not.
const vercelLive = process.env.VERCEL_ENV === "preview" ? " https://vercel.live" : "";

/**
 * Only this site's own scripts run here; images may come from any https host
 * (avatars are URLs people paste), nothing may frame the site, and nothing is
 * ever loaded over plain http.
 * ponytail: scripts allow 'unsafe-inline' because Next's own bootstrap is
 * inline; moving to per-request nonces (middleware + dynamic rendering) would
 * remove it, at the cost of static pages.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${GA_SCRIPT}${vercelLive}`,
  `style-src 'self' 'unsafe-inline'${vercelLive}`,
  "img-src 'self' data: blob: https:",
  `font-src 'self' data:${vercelLive ? " https://vercel.live https://assets.vercel.com" : ""}`,
  `connect-src 'self'${GA_CONNECT}${isDev ? " ws: wss:" : ""}${vercelLive ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
  ...(vercelLive ? ["frame-src https://vercel.live"] : []),
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Cross-site requests get the origin only, so a reset link's token never leaks in a Referer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The build type-checks the app, not the tests: from Next 16.3 it would check
  // everything tsconfig.json includes, and the tests are Jest's to run.
  typescript: { tsconfigPath: "tsconfig.build.json" },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "retroachievements.org",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "media.retroachievements.org",
      },
      // Steam spreads images across several CDNs: game icons on
      // media.steampowered.com, avatars and achievement badges on the
      // *.steamstatic.com mirrors, and older assets on steamcdn-a.
      {
        protocol: "https",
        hostname: "media.steampowered.com",
      },
      {
        protocol: "https",
        hostname: "**.steamstatic.com",
      },
      {
        protocol: "https",
        hostname: "steamcdn-a.akamaihd.net",
      },
    ],
  },
};

export default nextConfig;
