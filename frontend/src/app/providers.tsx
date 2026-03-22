"use client";

import { useEffect } from "react";
import { LanguageProvider } from "@/components/providers/language-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    if (!hydrated || !token) {
      return;
    }

    let active = true;
    const tick = () => {
      if (!active) {
        return;
      }
      void api.users.heartbeat().catch(() => undefined);
    };

    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [hydrated, token]);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <QueryProvider>{children}</QueryProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
