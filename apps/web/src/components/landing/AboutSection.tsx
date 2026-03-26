'use client';

import { motion } from 'framer-motion';
import { Bot, Video, Award, Smartphone } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            {t('landing.about.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('landing.about.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-6 text-center hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{t(feature.titleKey)}</h3>
              <p className="text-sm text-muted-foreground">{t(feature.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
