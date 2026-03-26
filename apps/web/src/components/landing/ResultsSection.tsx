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
    <section className="py-20 px-4">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">Что вы получите</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((result, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-dark-border bg-dark-card p-5">
              <span className="mt-0.5 shrink-0 text-brand">&#10003;</span>
              <span className="text-zinc-300">{result}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
