'use client';

import { Bot, Video, Award, Smartphone } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { motion } from 'framer-motion';
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
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-black text-foreground sm:text-4xl lg:text-5xl mb-4">
            {t('landing.about.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
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
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card hover-lift rounded-2xl p-7 text-center group cursor-default"
            >
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-400/20 border border-orange-500/10 flex items-center justify-center shadow-inner group-hover:from-orange-500/30 group-hover:to-amber-400/30 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{t(feature.titleKey)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(feature.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
