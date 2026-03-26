'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme';
import {
  Home, BookOpen, LayoutGrid, Award, User,
  BookMarked, Users, CreditCard, BarChart3,
  LogOut, GraduationCap, Sun, Moon, Calendar,
  Trophy, Settings, Flame, Globe, X, Menu,
} from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n/translations';

const navItems: { href: string; labelKey: TranslationKey; icon: typeof Home }[] = [
  { href: '/dashboard', labelKey: 'nav.home', icon: Home },
  { href: '/courses', labelKey: 'nav.courses', icon: LayoutGrid },
  { href: '/calendar', labelKey: 'nav.calendar', icon: Calendar },
  { href: '/achievements', labelKey: 'nav.achievements', icon: Trophy },
  { href: '/leaderboard', labelKey: 'nav.leaderboard', icon: Trophy },
  { href: '/settings', labelKey: 'nav.settings', icon: Settings },
];

const adminItems: { href: string; labelKey: TranslationKey; icon: typeof Home }[] = [
  { href: '/admin/courses', labelKey: 'nav.admin.courses', icon: BookMarked },
  { href: '/admin/students', labelKey: 'nav.admin.students', icon: Users },
  { href: '/admin/payments', labelKey: 'nav.admin.payments', icon: CreditCard },
  { href: '/admin/analytics', labelKey: 'nav.admin.analytics', icon: BarChart3 },
];

export function MobileNavToggle({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { t, locale, setLocale } = useI18n();
  const { dark, toggleTheme } = useTheme();

  const isAdmin = user?.role === 'ADMIN';

  function toggleLocale() {
    setLocale(locale === 'ru' ? 'kz' : 'ru');
  }

  function handleLogout() {
    logout();
    router.push('/login');
    onClose();
  }

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 max-w-[85vw] bg-background dark:bg-[#14141A] border-r border-border/50 z-50 flex flex-col transition-transform duration-300 ease-out md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/25 shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-foreground truncate">AiBot</h1>
              <p className="text-[10px] text-muted-foreground truncate">{t('dashboard.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {navItems.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              const label = t(item.labelKey);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-2xl text-sm transition-all min-h-[44px] ${
                    active
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Gamification Widget */}
          <div className="mx-1 mt-5 mb-2 rounded-2xl bg-card/50 border border-border/50 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-orange-500/10">
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-xs font-medium text-foreground">
                {t('common.streak')} 7 {t('common.days')}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground">{t('common.level')} 5</span>
                <span className="text-[10px] text-muted-foreground">68% — 320 XP</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-border/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: '68%' }}
                />
              </div>
            </div>
          </div>

          {isAdmin && (
            <>
              <div className="my-4 mx-3 border-t border-border/50" />
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('nav.admin')}
              </p>
              <div className="space-y-1">
                {adminItems.map(item => {
                  const active = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  const label = t(item.labelKey);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-2xl text-sm transition-all min-h-[44px] ${
                        active
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* Theme toggle + Language toggle + User */}
        <div className="border-t border-border/50 p-3 shrink-0 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 flex-1 px-3 py-2 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all min-h-[44px]"
            >
              {dark ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
              <span>{dark ? t('theme.light') : t('theme.dark')}</span>
            </button>
            <button
              onClick={toggleLocale}
              className="flex items-center justify-center w-11 h-11 rounded-2xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all border border-border/50 shrink-0"
              title={locale === 'ru' ? 'Kazakh' : 'Russian'}
            >
              {locale === 'ru' ? 'RU' : 'KZ'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.firstName || user?.email || 'User'}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {user?.role?.toLowerCase() || 'student'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={t('common.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
