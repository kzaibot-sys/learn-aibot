'use client';

import { motion } from 'framer-motion';
import { UserPlus, BookOpen, Play, Award } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            {t('landing.how.title')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center relative"
            >
              {/* Step number */}
              <div className="text-6xl font-black text-primary/10 absolute -top-4 left-1/2 -translate-x-1/2">
                {i + 1}
              </div>

              <div className="relative z-10 w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{t(step.titleKey)}</h3>
              <p className="text-sm text-muted-foreground">{t(step.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
