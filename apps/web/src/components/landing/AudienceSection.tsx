'use client';

import { motion } from 'framer-motion';
import { Users, Briefcase, RefreshCw, TrendingUp } from 'lucide-react';

const audiences = [
  { icon: Users, title: 'Начинающие специалисты', desc: 'Которые хотят получить структурированные знания с нуля' },
  { icon: Briefcase, title: 'Практикующие профессионалы', desc: 'Которым нужно систематизировать опыт и освоить новые инструменты' },
  { icon: RefreshCw, title: 'Карьерные переходчики', desc: 'Которые хотят сменить профессию и войти в новую сферу' },
  { icon: TrendingUp, title: 'Предприниматели', desc: 'Которым нужны практические навыки для развития бизнеса' },
];

export function AudienceSection() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center text-4xl font-black sm:text-5xl"
        >
          Для кого{' '}
          <span className="bg-gradient-to-r from-primary via-accent to-orange-400 bg-clip-text text-transparent">
            этот курс
          </span>
        </motion.h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {audiences.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 transition-all"
              >
                <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/15 to-orange-400/10 border border-primary/20 w-fit">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-foreground">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
