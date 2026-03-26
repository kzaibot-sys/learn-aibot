'use client';

import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export function Header() {
  const { t } = useI18n();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-card/30 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-accent to-orange-400 flex items-center justify-center shadow-xl shadow-primary/25 overflow-hidden">
            <GraduationCap className="w-5 h-5 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
          <span className="text-lg font-bold text-foreground">LearnHub Pro</span>
        </Link>
        <nav className="flex items-center gap-3">
          <a
            href="#program"
            className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            {t('landing.header.program')}
          </a>
          <a
            href="#reviews"
            className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            {t('landing.header.reviews')}
          </a>
          <a
            href="#pricing"
            className="rounded-2xl bg-gradient-to-r from-primary via-accent to-orange-400 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
          >
            {t('landing.header.cta')}
          </a>
        </nav>
      </div>
    </header>
  );
}
