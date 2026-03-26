'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme';
import {
  Home, BookOpen, LayoutGrid, Award, User,
  BookMarked, Users, CreditCard, BarChart3,
  LogOut, ChevronLeft, ChevronRight, GraduationCap,
  Sun, Moon, Calendar, Trophy, Settings, Globe,
} from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n/translations';

const navItems: { href: string; labelKey: TranslationKey; icon: typeof Home }[] = [
  { href: '/dashboard', labelKey: 'nav.home', icon: Home },
  { href: '/courses', labelKey: 'nav.courses', icon: LayoutGrid },
  { href: '/calendar', labelKey: 'nav.calendar', icon: Calendar },
  { href: '/achievements', labelKey: 'nav.achievements', icon: Trophy },
  { href: '/settings', labelKey: 'nav.settings', icon: Settings },
];

const adminItems: { href: string; labelKey: TranslationKey; icon: typeof Home }[] = [
  { href: '/admin/courses', labelKey: 'nav.admin.courses', icon: BookMarked },
  { href: '/admin/students', labelKey: 'nav.admin.students', icon: Users },
  { href: '/admin/payments', labelKey: 'nav.admin.payments', icon: CreditCard },
  { href: '/admin/analytics', labelKey: 'nav.admin.analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { t, locale, setLocale } = useI18n();
  const { dark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  function toggleLocale() {
    setLocale(locale === 'ru' ? 'kz' : 'ru');
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-background border-r border-border/50 hidden md:flex flex-col transition-all duration-300 z-40 ${collapsed ? 'w-16' : 'w-72'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50 shrink-0">
        <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-accent to-orange-400 flex items-center justify-center shadow-xl shadow-primary/25 shrink-0 overflow-hidden">
          <GraduationCap className="w-5 h-5 text-white relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate">LearnHub Pro</h1>
            <p className="text-[10px] text-muted-foreground truncate">{t('dashboard.subtitle')}</p>
          </div>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-all ${
                  active
                    ? 'bg-gradient-to-r from-primary via-accent to-orange-400 text-white shadow-xl shadow-primary/30 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Gamification widget — hidden until real API data is available */}

        {isAdmin && (
          <>
            <div className="my-4 mx-3 border-t border-border/50" />
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('nav.admin')}
              </p>
            )}
            <div className="space-y-1">
              {adminItems.map(item => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                const label = t(item.labelKey);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-all ${
                      active
                        ? 'bg-gradient-to-r from-primary via-accent to-orange-400 text-white shadow-xl shadow-primary/30 font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                    title={collapsed ? label : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Theme toggle + Language toggle + User */}
      <div className="border-t border-border/50 p-3 shrink-0 space-y-3">
        {/* Theme + Language row */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 flex-1 px-3 py-2 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            title={collapsed ? (dark ? t('theme.light') : t('theme.dark')) : undefined}
          >
            {dark ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            {!collapsed && <span>{dark ? t('theme.light') : t('theme.dark')}</span>}
          </button>

          {/* Language toggle */}
          <button
            onClick={toggleLocale}
            className="flex items-center justify-center w-10 h-10 rounded-2xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all border border-border/50 shrink-0"
            title={locale === 'ru' ? 'Kazakh' : 'Russian'}
          >
            {locale === 'ru' ? 'RU' : 'KZ'}
          </button>
        </div>

        {/* User profile */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold shrink-0">
            {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.firstName || user?.email || 'User'}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {user?.role?.toLowerCase() || 'student'}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title={t('common.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
