'use client';

import { Star } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { motion } from 'framer-motion';
import type { TranslationKey } from '@/lib/i18n/translations';

export function ReviewsSection() {
  const { t } = useI18n();

  const reviews = ([1, 2, 3] as const).map((n) => ({
    name: t(`landing.reviews.name${n}` as TranslationKey),
    text: t(`landing.reviews.text${n}` as TranslationKey),
    role: t(`landing.reviews.role${n}` as TranslationKey),
  }));

  return (
    <section id="reviews" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl">
            {t('landing.reviews.title1')}{' '}
            <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              {t('landing.reviews.title2')}
            </span>
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card hover-lift rounded-3xl p-8 relative group"
            >
              {/* Decorative quote */}
              <div className="absolute top-4 right-6 text-6xl font-black text-primary/10 leading-none select-none group-hover:text-primary/15 transition-colors">
                &ldquo;
              </div>

              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-6 text-foreground/80 leading-relaxed relative z-10">{review.text}</p>
              <div className="flex items-center gap-3">
                <div className="p-0.5 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 shadow-md shadow-orange-500/20">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white font-bold text-sm">
                    {review.name[0]}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-foreground">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
