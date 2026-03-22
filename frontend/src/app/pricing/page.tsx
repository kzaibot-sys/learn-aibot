const plans = [
  { name: "Free", price: "0 тг", features: "Демо-доступ, базовые курсы" },
  { name: "Pro", price: "9 900 тг", features: "Полный каталог, сертификаты" },
  { name: "Team", price: "По запросу", features: "Корпоративный кабинет" },
];

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Тарифы</h1>
      <p className="mt-2 text-muted-foreground">Простая стартовая сетка для MVP.</p>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className="rounded-2xl bg-white p-6 ring-1 ring-slate-100"
          >
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-2xl font-bold text-primary">{plan.price}</p>
            <p className="mt-3 text-sm text-muted-foreground">{plan.features}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
