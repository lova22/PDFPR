/**
 * SECURITY AUDIT:
 * - Server-side only. This file MUST NOT be imported into any client component.
 * - Uses @supabase/ssr createServerClient with cookie-based session management.
 * - The Service Role Key is intentionally NOT used here.
 *   For admin tasks, use a separate server action that never leaks to the client.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for use in:
 *  - Route Handlers (app/api/**\/route.ts)
 *  - Server Components
 *  - Server Actions
 *
 * This reads the session from HTTP-only cookies — never from localStorage.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables on the server. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll called from a Server Component — session refresh handled by middleware
        }
      },
    },
  });
}
