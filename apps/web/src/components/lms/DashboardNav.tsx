'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/context';

export function DashboardNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { t } = useI18n();

  const links = [
    { href: '/dashboard', label: t('nav.courses') },
    { href: '/profile', label: t('profile.title') },
  ];

  if (user?.role === 'ADMIN') {
    links.push({ href: '/admin/courses', label: t('nav.admin') });
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold text-foreground">LMS</Link>
          <nav className="hidden sm:flex items-center gap-4">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  pathname.startsWith(link.href) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user?.firstName || user?.email}
          </span>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('common.logout')}
          </button>
        </div>
      </div>
    </header>
  );
}
