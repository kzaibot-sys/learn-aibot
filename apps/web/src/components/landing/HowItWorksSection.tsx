'use client';

import { UserPlus, BookOpen, Play, Award } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { motion } from 'framer-motion';
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
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-black text-foreground sm:text-4xl lg:text-5xl mb-4">
            {t('landing.how.title')}
          </h2>
        </motion.div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Horizontal connecting line for desktop */}
          <div className="hidden lg:block absolute top-9 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {steps.map((step, i) => (
            <motion.div
              key={step.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass-card rounded-2xl p-6 text-center relative group"
            >
              {/* Step number badge */}
              <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-orange-500/30 relative z-10">
                {i + 1}
              </div>

              {/* Vertical line for mobile between steps */}
              {i < steps.length - 1 && (
                <div className="lg:hidden absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-px h-8 bg-gradient-to-b from-orange-500/30 to-transparent" />
              )}

              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-orange-500/15 to-amber-400/15 border border-orange-500/10 flex items-center justify-center group-hover:from-orange-500/25 group-hover:to-amber-400/25 transition-all duration-300">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{t(step.titleKey)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(step.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
