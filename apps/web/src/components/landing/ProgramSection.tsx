'use client';

import { motion } from 'framer-motion';
import { BookOpen, Code, Rocket, Brain, Trophy } from 'lucide-react';

const modules = [
  { icon: BookOpen, title: 'Модуль 1: Введение', desc: 'Основы и подготовка к обучению', lessons: 5 },
  { icon: Brain, title: 'Модуль 2: Фундамент', desc: 'Базовые концепции и инструменты', lessons: 8 },
  { icon: Code, title: 'Модуль 3: Практика', desc: 'Реальные проекты и задачи', lessons: 10 },
  { icon: Rocket, title: 'Модуль 4: Продвинутый уровень', desc: 'Углублённое изучение тем', lessons: 7 },
  { icon: Trophy, title: 'Модуль 5: Финальный проект', desc: 'Создание собственного проекта', lessons: 4 },
];

export function ProgramSection() {
  return (
    <section id="program" className="py-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center text-4xl font-black sm:text-5xl"
        >
          Программа{' '}
          <span className="bg-gradient-to-r from-primary via-accent to-orange-400 bg-clip-text text-transparent">
            курса
          </span>
        </motion.h2>
        <div className="space-y-4">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all cursor-default"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/15 to-orange-400/10 border border-primary/20">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{mod.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{mod.desc}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-medium text-primary">
                    {mod.lessons} уроков
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
