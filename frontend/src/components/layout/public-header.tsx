"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useLanguage } from "@/components/providers/language-provider";

const text = {
  en: {
    login: "Sign in",
    register: "Create account",
  },
  ru: {
    login: "Войти",
    register: "Регистрация",
  },
  kz: {
    login: "Кіру",
    register: "Тіркелу",
  },
} as const;

export function PublicHeader({ active }: { active?: "login" | "register" }) {
  const { locale } = useLanguage();
  const t = text[locale];

  return (
    <header className="mx-auto flex w-full max-w-[1300px] items-center justify-between gap-3 rounded-3xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3 md:px-6">
      <Link href="/" className="inline-flex items-center gap-2">
        <div className="rounded-xl bg-[var(--accent)]/15 p-2 text-[var(--accent)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Learn.Aibot.KZ</span>
      </Link>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <Link
          href="/login"
          className={`rounded-xl border px-3 py-2 text-sm ${
            active === "login"
              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
              : "border-[var(--line)]"
          }`}
        >
          {t.login}
        </Link>
        <Link
          href="/register"
          className={`rounded-xl px-3 py-2 text-sm font-medium ${
            active === "register"
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--line)]"
          }`}
        >
          {t.register}
        </Link>
      </div>
    </header>
  );
}


