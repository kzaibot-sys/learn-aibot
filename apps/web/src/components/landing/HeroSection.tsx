'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

export function HeroSection() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scale = useTransform(scrollY, [0, 400], [1, 0.95]);

  return (
    <section className="relative flex min-h-screen items-center justify-center px-4 pt-16 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: '25s' }} />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />

      <motion.div
        style={{ opacity, scale }}
        className="relative z-10 mx-auto max-w-5xl text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-5 py-2 text-sm text-primary mb-8"
        >
          <Sparkles className="w-4 h-4" />
          Новый курс уже доступен
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 text-5xl font-black tracking-tight sm:text-6xl lg:text-8xl"
        >
          Освойте новые навыки{' '}
          <span className="bg-gradient-to-r from-primary via-accent to-orange-400 bg-clip-text text-transparent">
            с экспертами
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl"
        >
          Структурированные курсы с видеоуроками, практическими заданиями и поддержкой от ИИ-помощника. Учитесь в удобном темпе.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <motion.a
            href="#pricing"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-accent to-orange-400 px-8 py-5 text-lg font-bold text-white shadow-2xl shadow-primary/50 hover:shadow-primary/70 transition-shadow"
          >
            Начать обучение
            <ArrowRight className="w-5 h-5" />
          </motion.a>
          <motion.a
            href="#program"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center rounded-2xl border-2 border-border hover:border-primary/50 bg-secondary/50 backdrop-blur-sm px-8 py-5 text-lg font-bold text-foreground transition-colors"
          >
            Программа курса
          </motion.a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ opacity: { delay: 1 }, y: { repeat: Infinity, duration: 2 } }}
          className="mt-16 text-muted-foreground"
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 mx-auto flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-primary rounded-full" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
