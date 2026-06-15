"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Whether a live Supabase backend is configured. When false, HartCare runs
 * entirely on the local-first store (src/lib/store.ts) so the product is
 * fully usable for demos and development without any backend setup.
 */
export const SUPABASE_ENABLED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
