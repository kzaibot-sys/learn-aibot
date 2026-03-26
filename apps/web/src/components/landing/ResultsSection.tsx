'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const results = [
  'Глубокое понимание предмета и уверенность в своих навыках',
  'Портфолио из реальных проектов для резюме',
  'Сертификат о прохождении курса',
  'Доступ к сообществу единомышленников',
  'Навыки, которые можно применить на практике сразу',
  'Поддержка ИИ-помощника на всём пути обучения',
];

export function ResultsSection() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center text-4xl font-black sm:text-5xl"
        >
          Что вы{' '}
          <span className="bg-gradient-to-r from-primary via-accent to-orange-400 bg-clip-text text-transparent">
            получите
          </span>
        </motion.h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((result, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="flex items-start gap-4 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 transition-all"
            >
              <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-primary/10 border border-primary/20">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-foreground/90">{result}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
