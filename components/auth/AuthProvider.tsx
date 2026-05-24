"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Failed to sign in anonymously:", error);
        }
      }
    };

    initAuth();
  }, []);

  return <>{children}</>;
}
