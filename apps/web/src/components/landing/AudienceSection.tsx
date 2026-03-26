const audiences = [
  { title: 'Начинающие специалисты', desc: 'Которые хотят получить структурированные знания с нуля' },
  { title: 'Практикующие профессионалы', desc: 'Которым нужно систематизировать опыт и освоить новые инструменты' },
  { title: 'Карьерные переходчики', desc: 'Которые хотят сменить профессию и войти в новую сферу' },
  { title: 'Предприниматели', desc: 'Которым нужны практические навыки для развития бизнеса' },
];

export function AudienceSection() {
  return (
    <section className="bg-dark-card py-20 px-4">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">Для кого этот курс</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {audiences.map((item, i) => (
            <div key={i} className="rounded-xl border border-dark-border bg-dark-card p-6">
              <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
