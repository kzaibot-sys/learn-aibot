'use client';

import { Sparkles, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export function HeroSection() {
  const { t } = useI18n();

  return (
    <section className="relative flex min-h-screen items-center justify-center px-4 pt-16 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: '25s' }} />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
      {/* Decorative grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-5 py-2.5 text-sm font-semibold text-primary mb-8 animate-pulse-glow shadow-lg shadow-primary/10">
          <Sparkles className="w-4 h-4" />
          {t('landing.hero.badge')}
        </div>

        <h1 className="animate-fade-in-up mb-6 text-5xl font-black tracking-tight sm:text-6xl lg:text-8xl leading-[1.05]" style={{ animationDelay: '0.1s' }}>
          {t('landing.hero.title1')}{' '}
          <span className="gradient-text bg-gradient-to-r from-primary via-accent to-orange-400">
            {t('landing.hero.title2')}
          </span>
        </h1>

        <p className="animate-fade-in-up mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed" style={{ animationDelay: '0.2s' }}>
          {t('landing.hero.subtitle')}
        </p>

        <div className="animate-fade-in-up flex flex-col items-center gap-4 sm:flex-row sm:justify-center" style={{ animationDelay: '0.3s' }}>
          <a
            href="/login"
            className="hover-lift inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-accent to-orange-400 px-8 py-5 text-lg font-bold text-white shadow-2xl shadow-primary/40 hover:shadow-primary/60 active:scale-95 transition-all"
          >
            {t('landing.hero.cta')}
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#program"
            className="inline-flex items-center rounded-2xl border border-border/60 hover:border-primary/50 bg-card/60 backdrop-blur-md px-8 py-5 text-lg font-bold text-foreground hover:scale-105 active:scale-95 transition-all shadow-sm hover:shadow-md"
          >
            {t('landing.hero.program')}
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 text-muted-foreground animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 mx-auto flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-primary rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
