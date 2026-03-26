'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';

export function DashboardNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const links = [
    { href: '/dashboard', label: 'Мои курсы' },
    { href: '/profile', label: 'Профиль' },
  ];

  if (user?.role === 'ADMIN') {
    links.push({ href: '/admin/courses', label: 'Админ' });
  }

  return (
    <header className="border-b border-gray-800 bg-gray-950">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold text-white">LMS</Link>
          <nav className="hidden sm:flex items-center gap-4">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  pathname.startsWith(link.href) ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:block">
            {user?.firstName || user?.email}
          </span>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}
