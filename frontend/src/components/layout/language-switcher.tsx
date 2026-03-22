"use client";

import { useLanguage, type AppLocale } from "@/components/providers/language-provider";

const items: Array<{ locale: AppLocale; label: string }> = [
  { locale: "en", label: "EN" },
  { locale: "ru", label: "RU" },
  { locale: "kz", label: "KZ" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-xl border border-[var(--line)] bg-[var(--panel)] p-1">
      {items.map((item) => (
        <button
          key={item.locale}
          type="button"
          onClick={() => setLocale(item.locale)}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            locale === item.locale
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--muted)] hover:bg-[var(--soft)]"
          }`}
          aria-label={`Switch language to ${item.label}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
