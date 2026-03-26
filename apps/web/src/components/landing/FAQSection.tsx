'use client';

import { useState } from 'react';

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
    <section className="bg-dark-card py-20 px-4">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">Частые вопросы</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-dark-border bg-dark-card">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <span className="font-medium text-white">{faq.q}</span>
                <span className={`ml-4 shrink-0 text-zinc-500 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}>
                  &#9660;
                </span>
              </button>
              {openIndex === i && (
                <div className="border-t border-dark-border px-5 pb-5 pt-3">
                  <p className="text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
