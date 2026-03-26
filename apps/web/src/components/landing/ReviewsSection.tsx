const reviews = [
  { name: 'Анна К.', text: 'Отличный курс! Наконец-то нашла структурированный материал. Задания помогли закрепить теорию на практике.', role: 'Веб-разработчик' },
  { name: 'Дмитрий М.', text: 'ИИ-помощник в Telegram — это гениально. Мог задать вопрос в любое время и получить понятный ответ.', role: 'Начинающий специалист' },
  { name: 'Елена С.', text: 'Прошла курс за 3 недели. Всё понятно, видео качественные, задания по делу. Рекомендую!', role: 'Продакт-менеджер' },
];

export function ReviewsSection() {
  return (
    <section className="bg-dark-card py-20 px-4">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">Отзывы студентов</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {reviews.map((review, i) => (
            <div key={i} className="rounded-xl border border-dark-border bg-dark-card p-6">
              <p className="mb-4 text-sm text-zinc-300 leading-relaxed">&laquo;{review.text}&raquo;</p>
              <div>
                <p className="font-semibold text-white">{review.name}</p>
                <p className="text-xs text-zinc-500">{review.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
