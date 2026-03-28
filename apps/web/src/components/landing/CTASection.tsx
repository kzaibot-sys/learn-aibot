'use client';

import { useI18n } from '@/lib/i18n/context';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export function CTASection() {
  const { t } = useI18n();

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 p-10 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <Sparkles className="w-10 h-10 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
              {t('landing.cta.title')}
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('landing.cta.subtitle')}
            </p>
            <a
              href="https://t.me/aibot_learn_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-lift inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-primary shadow-2xl transition-all hover:shadow-white/25 active:scale-95"
            >
              {t('landing.cta.button')}
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
