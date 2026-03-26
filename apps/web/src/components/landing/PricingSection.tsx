export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4">
      <div className="mx-auto max-w-md">
        <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">Стоимость</h2>
        <div className="rounded-2xl border border-brand/30 bg-gradient-to-b from-brand/10 to-dark-card p-8 text-center shadow-xl shadow-brand/10">
          <p className="mb-2 text-sm uppercase tracking-wider text-brand">Полный доступ</p>
          <div className="mb-2 flex items-baseline justify-center gap-1">
            <span className="text-5xl font-extrabold text-white">4 990</span>
            <span className="text-xl text-zinc-400">&#8381;</span>
          </div>
          <p className="mb-6 text-sm text-zinc-500">единоразовый платёж, доступ навсегда</p>
          <ul className="mb-8 space-y-3 text-left text-sm text-zinc-300">
            <li className="flex items-start gap-2"><span className="text-brand">&#10003;</span> 34 видеоурока</li>
            <li className="flex items-start gap-2"><span className="text-brand">&#10003;</span> Практические задания</li>
            <li className="flex items-start gap-2"><span className="text-brand">&#10003;</span> ИИ-помощник 24/7</li>
            <li className="flex items-start gap-2"><span className="text-brand">&#10003;</span> Сертификат</li>
            <li className="flex items-start gap-2"><span className="text-brand">&#10003;</span> Обновления курса бесплатно</li>
          </ul>
          <a
            href="#"
            className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-brand/20 hover:bg-brand-hover transition-colors"
          >
            Купить курс
          </a>
        </div>
      </div>
    </section>
  );
}
