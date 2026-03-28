'use client';

import { Sparkles, ArrowRight, Users, BookOpen, ThumbsUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/translations';

const stats: { icon: typeof Users; valueKey: TranslationKey; labelKey: TranslationKey }[] = [
  { icon: Users, valueKey: 'landing.hero.stat1Value', labelKey: 'landing.hero.stat1Label' },
  { icon: BookOpen, valueKey: 'landing.hero.stat2Value', labelKey: 'landing.hero.stat2Label' },
  { icon: ThumbsUp, valueKey: 'landing.hero.stat3Value', labelKey: 'landing.hero.stat3Label' },
];

export function HeroSection() {
  const { t } = useI18n();

  return (
    <section className="relative flex min-h-screen items-center justify-center px-4 pt-16 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-orange-500/8 to-amber-400/8 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-orange-600/6 to-orange-400/6 rounded-full blur-3xl" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,133,51,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,133,51,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Floating decorative shapes — CSS animations instead of framer-motion */}
      <div className="absolute top-[20%] left-[10%] w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-400/10 border border-orange-500/10 hidden lg:block animate-float-slow" />
      <div className="absolute top-[30%] right-[8%] w-12 h-12 rounded-full bg-gradient-to-br from-orange-400/10 to-orange-500/10 border border-orange-400/10 hidden lg:block animate-float-medium" />
      <div className="absolute bottom-[25%] left-[15%] w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/10 to-orange-500/10 border border-amber-400/10 hidden lg:block animate-float-rotate" />
      <div className="absolute bottom-[35%] right-[12%] w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/8 to-amber-500/8 border border-orange-500/8 hidden lg:block animate-float-slow-reverse" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/30 px-5 py-2.5 text-sm font-semibold text-primary mb-8 shadow-lg shadow-orange-500/10">
          <Sparkles className="w-4 h-4" />
          {t('landing.hero.badge')}
        </div>

        {/* Heading */}
        <h1 className="animate-fade-in-up [animation-delay:100ms] mb-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-7xl leading-[1.1]">
          {t('landing.hero.title1')}{' '}
          <span className="gradient-text bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400">
            {t('landing.hero.title2')}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up [animation-delay:200ms] mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
          {t('landing.hero.subtitle')}
        </p>

        {/* CTA */}
        <div className="animate-fade-in-up [animation-delay:300ms] flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="https://t.me/aibot_learn_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="hover-lift inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-8 py-4 text-lg font-bold text-white shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 active:scale-95 transition-all"
          >
            {t('landing.hero.cta')}
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>

        {/* Stats */}
        <div className="animate-fade-in-up [animation-delay:500ms] mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
          {stats.map((stat) => (
            <div key={stat.valueKey} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-foreground">{t(stat.valueKey)}</p>
                <p className="text-xs text-muted-foreground">{t(stat.labelKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="animate-fade-in [animation-delay:1000ms] mt-16 text-muted-foreground">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 mx-auto flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-primary rounded-full animate-scroll-dot" />
          </div>
        </div>
      </div>
    </section>
  );
}
