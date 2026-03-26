export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center px-4 pt-16">
      <div className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand/10 rounded-full blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 border border-brand/20 px-4 py-1.5 text-sm text-brand mb-6">
          <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
          Новый курс уже доступен
        </div>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Освойте новые навыки
          <span className="block text-brand">с экспертами-практиками</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-400 sm:text-xl">
          Структурированные курсы с видеоуроками, практическими заданиями и поддержкой от ИИ-помощника. Учитесь в удобном темпе.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="#pricing"
            className="inline-flex items-center rounded-xl bg-brand px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-brand/20 hover:bg-brand-hover transition-colors"
          >
            Начать обучение
          </a>
          <a
            href="#program"
            className="inline-flex items-center rounded-xl border border-dark-border px-8 py-3.5 text-lg font-semibold text-zinc-300 hover:bg-dark-card transition-colors"
          >
            Программа курса
          </a>
        </div>
      </div>
    </section>
  );
}
