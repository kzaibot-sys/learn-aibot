'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { ScrollReveal } from '@/hooks/useScrollAnimation';
import type { TranslationKey } from '@/lib/i18n/translations';

export function FAQSection() {
  const { t } = useI18n();

  const faqs = ([1, 2, 3, 4, 5, 6] as const).map((n) => ({
    q: t(`landing.faq.q${n}` as TranslationKey),
    a: t(`landing.faq.a${n}` as TranslationKey),
  }));
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <h2 className="mb-16 text-center text-4xl font-black sm:text-5xl">
            {t('landing.faq.title1')}{' '}
            <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              {t('landing.faq.title2')}
            </span>
          </h2>
        </ScrollReveal>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <ScrollReveal
              key={i}
              delay={i * 50}
            >
              <div
                className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${
                  openIndex === i ? 'border-l-4 border-l-primary shadow-lg shadow-orange-500/10' : 'border-l-4 border-l-transparent'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="flex w-full items-center justify-between p-6 text-left hover:bg-primary/5 transition-colors"
                >
                  <span className={`font-bold pr-4 transition-colors ${openIndex === i ? 'text-primary' : 'text-foreground'}`}>{faq.q}</span>
                  <div className={`shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}>
                    <ChevronDown className={`w-5 h-5 transition-colors ${openIndex === i ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-out ${openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="border-t border-border/30 px-6 pb-6 pt-4">
                    <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
