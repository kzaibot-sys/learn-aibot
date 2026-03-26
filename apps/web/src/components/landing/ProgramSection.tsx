const modules = [
  { title: 'Модуль 1: Введение', desc: 'Основы и подготовка к обучению', lessons: 5 },
  { title: 'Модуль 2: Фундамент', desc: 'Базовые концепции и инструменты', lessons: 8 },
  { title: 'Модуль 3: Практика', desc: 'Реальные проекты и задачи', lessons: 10 },
  { title: 'Модуль 4: Продвинутый уровень', desc: 'Углублённое изучение тем', lessons: 7 },
  { title: 'Модуль 5: Финальный проект', desc: 'Создание собственного проекта', lessons: 4 },
];

export function ProgramSection() {
  return (
    <section id="program" className="py-20 px-4">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">Программа курса</h2>
        <div className="space-y-4">
          {modules.map((mod, i) => (
            <div key={i} className="rounded-xl border border-dark-border bg-dark-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{mod.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{mod.desc}</p>
                </div>
                <span className="shrink-0 rounded-full bg-brand/10 px-3 py-1 text-xs text-zinc-400">
                  {mod.lessons} уроков
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
