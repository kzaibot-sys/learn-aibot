'use client';

import { CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { ScrollReveal } from '@/hooks/useScrollAnimation';
import type { TranslationKey } from '@/lib/i18n/translations';

export function ResultsSection() {
  const { t } = useI18n();

  const results = ([1, 2, 3, 4, 5, 6] as const).map(
    (n) => t(`landing.results.item${n}` as TranslationKey)
  );
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <ScrollReveal>
          <h2 className="mb-16 text-center text-4xl font-black sm:text-5xl">
            {t('landing.results.title1')}{' '}
            <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              {t('landing.results.title2')}
            </span>
          </h2>
        </ScrollReveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((result, i) => (
            <ScrollReveal
              key={i}
              delay={i * 50}
              className="flex items-start gap-4 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-orange-500/50 transition-all"
            >
              <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-foreground/90">{result}</span>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
