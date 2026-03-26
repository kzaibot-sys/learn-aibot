'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'Как долго длится доступ к курсу?', a: 'Доступ к курсу предоставляется навсегда. Вы можете проходить его в своём темпе и возвращаться к материалам в любое время.' },
  { q: 'Нужен ли опыт для прохождения?', a: 'Нет, курс подходит для начинающих. Мы начинаем с основ и постепенно усложняем материал.' },
  { q: 'Как работает ИИ-помощник?', a: 'ИИ-помощник доступен в Telegram боте. Вы можете задавать вопросы по материалам курса и получать мгновенные ответы 24/7.' },
  { q: 'Можно ли вернуть деньги?', a: 'Да, в течение 14 дней после покупки вы можете запросить полный возврат, если курс вам не подошёл.' },
  { q: 'Будут ли обновления курса?', a: 'Да, мы регулярно обновляем материалы и добавляем новые уроки. Все обновления доступны бесплатно.' },
  { q: 'Как происходит оплата?', a: 'Мы принимаем оплату через ЮKassa (карты РФ и СНГ) и Stripe (международные карты).' },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center text-4xl font-black sm:text-5xl"
        >
          Частые{' '}
          <span className="bg-gradient-to-r from-primary via-accent to-orange-400 bg-clip-text text-transparent">
            вопросы
          </span>
        </motion.h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-3xl border bg-card/50 backdrop-blur-sm transition-colors ${
                openIndex === i ? 'border-primary/50' : 'border-border/50'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <span className="font-bold text-foreground pr-4">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/50 px-6 pb-6 pt-4">
                      <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
