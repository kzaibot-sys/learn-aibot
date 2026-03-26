'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/translations';

const reviewTexts = [
  'Отличный курс! Наконец-то нашла структурированный материал. Задания помогли закрепить теорию на практике.',
  'ИИ-помощник в Telegram — это гениально. Мог задать вопрос в любое время и получить понятный ответ.',
  'Прошла курс за 3 недели. Всё понятно, видео качественные, задания по делу. Рекомендую!',
];

export function ReviewsSection() {
  const { t } = useI18n();

  const reviews = ([1, 2, 3] as const).map((n, i) => ({
    name: t(`landing.reviews.name${n}` as TranslationKey),
    text: reviewTexts[i],
    role: t(`landing.reviews.role${n}` as TranslationKey),
  }));
  return (
    <section id="reviews" className="py-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center text-4xl font-black sm:text-5xl"
        >
          {t('landing.reviews.title1')}{' '}
          <span className="bg-gradient-to-r from-primary via-accent to-orange-400 bg-clip-text text-transparent">
            {t('landing.reviews.title2')}
          </span>
        </motion.h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 transition-all"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-6 text-foreground/80 leading-relaxed">&laquo;{review.text}&raquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                  {review.name[0]}
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
