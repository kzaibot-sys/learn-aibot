'use client';

import { Users, Briefcase, RefreshCw, TrendingUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { ScrollReveal } from '@/hooks/useScrollAnimation';

export function AudienceSection() {
  const { t } = useI18n();

  const audiences = [
    { icon: Users, title: t('landing.audience.beginners'), desc: t('landing.audience.beginnersDesc') },
    { icon: Briefcase, title: t('landing.audience.professionals'), desc: t('landing.audience.professionalsDesc') },
    { icon: RefreshCw, title: t('landing.audience.switchers'), desc: t('landing.audience.switchersDesc') },
    { icon: TrendingUp, title: t('landing.audience.entrepreneurs'), desc: t('landing.audience.entrepreneursDesc') },
  ];
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <h2 className="mb-16 text-center text-4xl font-black sm:text-5xl">
            {t('landing.audience.title1')}{' '}
            <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              {t('landing.audience.title2')}
            </span>
          </h2>
        </ScrollReveal>
        <div className="grid gap-6 sm:grid-cols-2">
          {audiences.map((item, i) => {
            const Icon = item.icon;
            return (
              <ScrollReveal
                key={i}
                delay={i * 100}
                className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20 transition-all"
              >
                <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 via-orange-400/15 to-orange-400/10 border border-orange-500/20 w-fit">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-foreground">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
