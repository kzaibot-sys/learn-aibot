'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import {
  Home, BookOpen, LayoutGrid, Award, User,
  BookMarked, Users, CreditCard, BarChart3,
  LogOut, ChevronLeft, ChevronRight, GraduationCap,
  Sun, Moon, Calendar, Trophy, Settings, Flame,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Главная', icon: Home },
  { href: '/courses', label: 'Курсы', icon: LayoutGrid },
  { href: '/calendar', label: 'Календарь', icon: Calendar },
  { href: '/achievements', label: 'Достижения', icon: Trophy },
  { href: '/settings', label: 'Настройки', icon: Settings },
];

const adminItems = [
  { href: '/admin/courses', label: 'Курсы', icon: BookMarked },
  { href: '/admin/students', label: 'Студенты', icon: Users },
  { href: '/admin/payments', label: 'Платежи', icon: CreditCard },
  { href: '/admin/analytics', label: 'Аналитика', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(true);

  const isAdmin = user?.role === 'ADMIN';

  function toggleTheme() {
    setDark(!dark);
    document.documentElement.classList.toggle('dark');
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-background border-r border-border/50 flex flex-col transition-all duration-300 z-40 ${collapsed ? 'w-16' : 'w-72'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50 shrink-0">
        <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-accent to-orange-400 flex items-center justify-center shadow-xl shadow-primary/25 shrink-0 overflow-hidden">
          <GraduationCap className="w-5 h-5 text-white relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate">LearnHub Pro</h1>
            <p className="text-[10px] text-muted-foreground truncate">Продолжай развиваться</p>
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
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-all ${
                  active
                    ? 'bg-gradient-to-r from-primary via-accent to-orange-400 text-white shadow-xl shadow-primary/30 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Gamification Widget */}
        {!collapsed && (
          <div className="mx-1 mt-5 mb-2 rounded-2xl bg-card/50 border border-border/50 p-3 space-y-3">
            {/* Streak */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-orange-500/10">
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-xs font-medium text-foreground">
                Серия обучения 7 дней
              </span>
            </div>

            {/* Level + XP */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground">
                  Level 5
                </span>
                <span className="text-[10px] text-muted-foreground">
                  68% — 320 XP
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-border/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-orange-400"
                  style={{ width: '68%' }}
                />
              </div>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="flex justify-center mt-4 mb-2">
            <div className="p-1.5 rounded-xl bg-orange-500/10" title="Серия обучения: 7 дней">
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
          </div>
        )}

        {isAdmin && (
          <>
            <div className="my-4 mx-3 border-t border-border/50" />
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Админ
              </p>
            )}
            <div className="space-y-1">
              {adminItems.map(item => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-all ${
                      active
                        ? 'bg-gradient-to-r from-primary via-accent to-orange-400 text-white shadow-xl shadow-primary/30 font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Theme toggle + User */}
      <div className="border-t border-border/50 p-3 shrink-0 space-y-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
          title={collapsed ? (dark ? 'Светлая тема' : 'Тёмная тема') : undefined}
        >
          {dark ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
          {!collapsed && <span>{dark ? 'Светлая тема' : 'Тёмная тема'}</span>}
        </button>

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
              <p className="text-[10px] text-primary">Premium</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
