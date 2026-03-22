"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppLocale = "en" | "ru" | "kz";

interface LanguageContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
}

const STORAGE_KEY = "learn.aibot.locale";
const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLocale(value: string | null): value is AppLocale {
  return value === "en" || value === "ru" || value === "kz";
}

function detectInitialLocale(): AppLocale {
  if (typeof window === "undefined") {
    return "en";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) {
    return stored;
  }

  const lang = window.navigator.language.toLowerCase();
  if (lang.startsWith("ru")) {
    return "ru";
  }
  if (lang.startsWith("kk") || lang.startsWith("kz")) {
    return "kz";
  }
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(detectInitialLocale);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const htmlLang = locale === "kz" ? "kk" : locale;
    document.documentElement.lang = htmlLang;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
    }),
    [locale, setLocale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
