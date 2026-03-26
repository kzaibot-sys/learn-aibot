'use client';

import { Bot, Video, Award, Smartphone } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { ScrollReveal } from '@/hooks/useScrollAnimation';
import type { TranslationKey } from '@/lib/i18n/translations';

const features: { icon: typeof Bot; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: Bot, titleKey: 'landing.about.ai', descKey: 'landing.about.aiDesc' },
  { icon: Video, titleKey: 'landing.about.video', descKey: 'landing.about.videoDesc' },
  { icon: Award, titleKey: 'landing.about.cert', descKey: 'landing.about.certDesc' },
  { icon: Smartphone, titleKey: 'landing.about.mobile', descKey: 'landing.about.mobileDesc' },
];

export function AboutSection() {
  const { t } = useI18n();

  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="text-center mb-14">
          <h2 className="text-3xl font-black text-foreground sm:text-4xl mb-4">
            {t('landing.about.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            {t('landing.about.subtitle')}
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <ScrollReveal
              key={feature.titleKey}
              delay={i * 100}
              className="glass-card hover-lift rounded-2xl p-7 text-center group"
            >
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-400/20 border border-orange-500/10 flex items-center justify-center shadow-inner group-hover:from-orange-500/30 group-hover:to-amber-400/30 transition-all">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{t(feature.titleKey)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(feature.descKey)}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
