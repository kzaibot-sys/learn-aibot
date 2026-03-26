'use client';

import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';

export function PricingSection() {
  return (
    <section id="pricing" className="py-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center text-4xl font-black sm:text-5xl"
        >
          Стоимость
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -8 }}
          className="relative rounded-3xl border-2 border-primary bg-gradient-to-br from-primary/20 to-accent/20 p-8 text-center shadow-2xl shadow-primary/20 overflow-hidden"
        >
          {/* Promo badge */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-primary to-accent text-white text-sm font-bold rounded-full px-5 py-1.5">
              <Zap className="w-4 h-4" />
              Полный доступ
            </span>
          </div>

          <div className="mb-2 flex items-baseline justify-center gap-2">
            <span className="text-6xl font-black bg-gradient-to-r from-primary via-accent to-orange-400 bg-clip-text text-transparent">
              4 990
            </span>
            <span className="text-2xl text-muted-foreground">₸</span>
          </div>
          <p className="mb-8 text-sm text-muted-foreground">единоразовый платёж, доступ навсегда</p>

          <ul className="mb-8 space-y-4 text-left">
            {[
              '34 видеоурока',
              'Практические задания',
              'ИИ-помощник 24/7',
              'Сертификат',
              'Обновления курса бесплатно',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-foreground/90">
                <div className="shrink-0 p-1 rounded-full bg-primary/10 border border-primary/20">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </div>
                {item}
              </li>
            ))}
          </ul>

          <motion.a
            href="#"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-primary via-accent to-orange-400 px-8 py-4 text-lg font-bold text-white shadow-2xl shadow-primary/50 hover:shadow-primary/70 transition-shadow"
          >
            Купить курс
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
