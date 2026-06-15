import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the default server output so `next start` works everywhere (Railway
  // Nixpacks, local production, etc.). HartCare runs in local-first demo mode
  // with no configuration; add the Supabase / Anthropic env vars to go live.
};

export default nextConfig;
