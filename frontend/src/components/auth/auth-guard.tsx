"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuthStore } from "@/lib/store/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLanguage();
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, token, router, pathname]);

  const loadingText =
    locale === "ru"
      ? "Проверяем авторизацию..."
      : locale === "kz"
        ? "Авторизация тексерілуде..."
        : "Checking authorization...";

  if (!hydrated || !token) {
    return (
      <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
        <p className="text-sm text-muted-foreground">{loadingText}</p>
      </main>
    );
  }

  return <>{children}</>;
}

