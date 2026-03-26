'use client';

import { UserPlus, BookOpen, Play, Award } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { ScrollReveal } from '@/hooks/useScrollAnimation';
import type { TranslationKey } from '@/lib/i18n/translations';

const steps: { icon: typeof UserPlus; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: UserPlus, titleKey: 'landing.how.step1', descKey: 'landing.how.step1Desc' },
  { icon: BookOpen, titleKey: 'landing.how.step2', descKey: 'landing.how.step2Desc' },
  { icon: Play, titleKey: 'landing.how.step3', descKey: 'landing.how.step3Desc' },
  { icon: Award, titleKey: 'landing.how.step4', descKey: 'landing.how.step4Desc' },
];

export function HowItWorksSection() {
  const { t } = useI18n();

  return (
    <section id="how" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal className="text-center mb-14">
          <h2 className="text-3xl font-black text-foreground sm:text-4xl mb-4">
            {t('landing.how.title')}
          </h2>
        </ScrollReveal>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Horizontal connecting line for desktop */}
          <div className="hidden lg:block absolute top-9 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {steps.map((step, i) => (
            <ScrollReveal
              key={step.titleKey}
              delay={i * 100}
              className="glass-card rounded-2xl p-6 text-center relative group"
            >
              {/* Step number badge */}
              <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary/30 relative z-10">
                {i + 1}
              </div>

              {/* Vertical line for mobile between steps */}
              {i < steps.length - 1 && (
                <div className="lg:hidden absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-px h-8 bg-gradient-to-b from-primary/30 to-transparent" />
              )}

              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/10 flex items-center justify-center group-hover:from-primary/25 group-hover:to-accent/25 transition-all">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{t(step.titleKey)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(step.descKey)}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
