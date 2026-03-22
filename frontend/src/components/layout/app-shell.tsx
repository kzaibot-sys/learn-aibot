"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Compass,
  LogOut,
  MessageSquare,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import { useMe } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/lib/store/auth-store";

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const links = [
  { href: "/dashboard", key: "dashboard", icon: BarChart3 },
  { href: "/courses", key: "catalog", icon: Compass },
  { href: "/my-courses", key: "myCourses", icon: BookOpen },
  { href: "/friends", key: "friends", icon: Users },
  { href: "/chat", key: "chat", icon: MessageSquare },
  { href: "/admin", key: "admin", icon: Shield },
];

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const { locale } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { data: me } = useMe();
  const clearAuth = useAuthStore((s) => s.clearAuth);

    const t = {
    en: {
      dashboard: "Dashboard",
      catalog: "Catalog",
      myCourses: "My Courses",
      friends: "Friends",
      chat: "Chat",
      admin: "Admin",
      workspace: "Workspace",
      platformWorkspace: "Platform workspace",
      signedInAs: "Signed in as",
      guest: "Guest",
      logout: "Logout",
      roleStudent: "Student",
      roleInstructor: "Instructor",
      roleAdmin: "Admin",
    },
    ru: {
      dashboard: "Панель",
      catalog: "Каталог",
      myCourses: "Мои курсы",
      friends: "Друзья",
      chat: "Чат",
      admin: "Админ",
      workspace: "Рабочее пространство",
      platformWorkspace: "Платформа обучения",
      signedInAs: "Вы вошли как",
      guest: "Гость",
      logout: "Выйти",
      roleStudent: "Студент",
      roleInstructor: "Преподаватель",
      roleAdmin: "Админ",
    },
    kz: {
      dashboard: "Басқару панелі",
      catalog: "Каталог",
      myCourses: "Менің курстарым",
      friends: "Достар",
      chat: "Чат",
      admin: "Әкімші",
      workspace: "Жұмыс кеңістігі",
      platformWorkspace: "Оқу платформасы",
      signedInAs: "Сіз кірдіңіз:",
      guest: "Қонақ",
      logout: "Шығу",
      roleStudent: "Студент",
      roleInstructor: "Оқытушы",
      roleAdmin: "Әкімші",
    },
  }[locale];

  const roleLabel =
    me?.role === "ADMIN"
      ? t.roleAdmin
      : me?.role === "INSTRUCTOR"
        ? t.roleInstructor
        : t.roleStudent;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
        <aside className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[0_1px_0_rgba(15,23,42,0.02),0_24px_60px_-44px_rgba(15,23,42,0.35)] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--accent-soft)] p-2.5 text-[var(--accent)] shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-[var(--text)]">Learn.Aibot</p>
              <p className="text-xs text-[var(--muted)]">{t.platformWorkspace}</p>
            </div>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mt-6 lg:flex-col lg:overflow-visible lg:pb-0">
            {links.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-w-max items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200 lg:w-full lg:min-w-0",
                    active
                      ? "border-transparent bg-[var(--accent)] text-white shadow-[0_14px_30px_-18px_rgba(15,118,110,0.75)]"
                      : "border-transparent text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--text)]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{t[item.key as keyof typeof t]}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-3.5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{t.signedInAs}</p>
            <p className="mt-2 truncate text-sm font-semibold text-[var(--text)]">{me?.email ?? t.guest}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{roleLabel}</p>
            <button
              type="button"
              onClick={() => {
                clearAuth();
                router.push("/login");
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-xs font-medium text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t.logout}
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="flex flex-col gap-4 rounded-[28px] border border-[var(--line)] bg-[var(--panel)] px-5 py-4 shadow-[0_1px_0_rgba(15,23,42,0.02),0_24px_60px_-44px_rgba(15,23,42,0.35)] sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">{t.workspace}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">{title}</h1>
              {subtitle ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{subtitle}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </header>

          <main className="min-w-0 pt-4 sm:pt-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

