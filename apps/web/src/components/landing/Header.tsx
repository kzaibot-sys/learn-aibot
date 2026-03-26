'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-dark-border bg-[#0A0A0B]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">LearnHub Pro</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Войти
          </Link>
          <a
            href="#pricing"
            className="rounded-xl bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
          >
            Начать
          </a>
        </nav>
      </div>
    </header>
  );
}
