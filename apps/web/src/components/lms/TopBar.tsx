'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme';
import { Sun, Moon } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { MobileNavToggle, MobileNav } from './MobileNav';

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { t, locale, setLocale } = useI18n();
  const { dark, toggleTheme } = useTheme();
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const navigateToSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/courses?search=${encodeURIComponent(trimmed)}`);
    }
  }, [router]);

  // Debounce: navigate after 300ms of no typing (minimum 2 chars)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        navigateToSearch(searchQuery);
      }, 300);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, navigateToSearch]);

  function toggleLocale() {
    setLocale(locale === 'ru' ? 'kz' : 'ru');
  }

  return (
    <>
      <header className="h-16 border-b border-border/50 bg-card/30 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
        {/* Left side: burger + search */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MobileNavToggle onOpen={() => setMobileNavOpen(true)} />

          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    navigateToSearch(searchQuery);
                  }
                }}
                placeholder={t('search.placeholder')}
                className="w-full rounded-xl bg-secondary/50 border border-border/50 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-3 ml-2 sm:ml-4 shrink-0">
          {/* Language */}
          <button
            onClick={toggleLocale}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors text-xs"
            title={t('common.switchLang')}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            {locale.toUpperCase()}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="hidden sm:flex p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            title={dark ? t('theme.light') : t('theme.dark')}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          <NotificationDropdown />
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}
