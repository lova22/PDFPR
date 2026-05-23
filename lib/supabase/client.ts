/**
 * SECURITY AUDIT:
 * - Uses NEXT_PUBLIC_ env vars (safe to expose in browser).
 * - NEVER imports or references the Service Role Key.
 * - This client is for browser-only use. Server-side calls use /lib/supabase/server.ts.
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client (singleton pattern).
 * Uses only the public anon key — safe to include in client bundles.
 *
 * Environment variables required in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
