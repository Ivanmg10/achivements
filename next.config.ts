import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
