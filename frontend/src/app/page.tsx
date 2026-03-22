"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, Trophy, Users } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { useLanguage } from "@/components/providers/language-provider";

const metrics = [
  { label: { en: "Learners", ru: "Студенты", kz: "Студенттер" }, value: "12.4k+" },
  { label: { en: "Courses", ru: "Курсы", kz: "Курстар" }, value: "320+" },
  { label: { en: "Completion", ru: "Завершение", kz: "Аяқталу" }, value: "86%" },
];

const highlights = {
  en: [
    "Role-based workspaces for Admin, Teacher, Student",
    "Course graph: courses -> modules -> lessons with progress locks",
    "Gamification: XP, levels, streaks and achievements",
    "Social graph with friends and real-time chat",
  ],
  ru: [
    "Ролевые рабочие пространства: Админ, Преподаватель, Студент",
    "Структура курсов: курсы -> модули -> уроки с блокировками прогресса",
    "Геймификация: XP, уровни, серии и достижения",
    "Социальные функции: друзья и чат в реальном времени",
  ],
  kz: [
    "Рөлдер бойынша кеңістіктер: Әкімші, Оқытушы, Студент",
    "Курс құрылымы: курс -> модуль -> сабақ және прогресс құлыптары",
    "Геймификация: XP, деңгей, streak және жетістіктер",
    "Әлеуметтік мүмкіндіктер: достар және real-time чат",
  ],
} as const;

export default function HomePage() {
  const { locale } = useLanguage();
  const t = {
    en: {
      badge: "Learn.Aibot.KZ Platform v2",
      title: "Build skills with a product-grade learning experience",
      subtitle:
        "Modern LMS with course authoring, live learning dashboard, progress intelligence, gamification and social collaboration.",
      openDashboard: "Open Dashboard",
      browse: "Browse courses",
      workspaceLearner: "Learner Workspace",
      workspaceLearnerDescription:
        "Progress, streaks, achievements and course continuation.",
      workspaceInstructor: "Instructor Console",
      workspaceInstructorDescription:
        "Publish course structure and upload lesson videos.",
      workspaceAdmin: "Admin Control Center",
      workspaceAdminDescription:
        "Monitor users, content quality, payments and growth metrics.",
    },
    ru: {
      badge: "Learn.Aibot.KZ Платформа v2",
      title: "Развивайте навыки на уровне продуктовой платформы",
      subtitle:
        "Современная LMS: создание курсов, live-дашборды, аналитика прогресса, геймификация и социальное взаимодействие.",
      openDashboard: "Открыть панель",
      browse: "Смотреть курсы",
      workspaceLearner: "Кабинет студента",
      workspaceLearnerDescription:
        "Прогресс, серии, достижения и продолжение обучения.",
      workspaceInstructor: "Кабинет преподавателя",
      workspaceInstructorDescription:
        "Публикация структуры курсов и загрузка видеоуроков.",
      workspaceAdmin: "Админ центр",
      workspaceAdminDescription:
        "Контроль пользователей, качества контента, оплат и метрик роста.",
    },
    kz: {
      badge: "Learn.Aibot.KZ Платформа v2",
      title: "Өнім деңгейіндегі оқу тәжірибесімен дағды дамытыңыз",
      subtitle:
        "Заманауи LMS: курс құрастыру, live-дашборд, прогресс аналитикасы, геймификация және әлеуметтік байланыс.",
      openDashboard: "Панельді ашу",
      browse: "Курстарды қарау",
      workspaceLearner: "Студент кабинеті",
      workspaceLearnerDescription:
        "Прогресс, streak, жетістіктер және курсты жалғастыру.",
      workspaceInstructor: "Оқытушы консолі",
      workspaceInstructorDescription:
        "Курс құрылымын жариялау және видео сабақтарды жүктеу.",
      workspaceAdmin: "Әкімші орталығы",
      workspaceAdminDescription:
        "Пайдаланушы, контент сапасы, төлем және өсім метрикаларын бақылау.",
    },
  }[locale];

  return (
    <main className="mx-auto max-w-[1300px] px-5 py-8 md:px-8">
      <PublicHeader />

      <header className="mt-5 rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 md:p-7">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-[var(--accent)]/15 p-2 text-[var(--accent)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">{t.badge}</span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              {t.title}
            </h1>
            <p className="mt-4 max-w-xl text-[var(--muted)]">{t.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
              >
                {t.openDashboard}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/courses"
                className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm font-medium"
              >
                {t.browse}
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {metrics.map((item) => (
              <article
                key={item.value + item.label.en}
                className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4"
              >
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  {item.label[locale]}
                </p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              </article>
            ))}
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {highlights[locale].map((item) => (
          <article
            key={item}
            className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--ok)]" />
            <p className="text-sm">{item}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Link
          href="/dashboard"
          className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 transition hover:-translate-y-0.5"
        >
          <Users className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="mt-3 text-lg font-semibold">{t.workspaceLearner}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.workspaceLearnerDescription}</p>
        </Link>

        <Link
          href="/instructor"
          className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 transition hover:-translate-y-0.5"
        >
          <Sparkles className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="mt-3 text-lg font-semibold">{t.workspaceInstructor}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.workspaceInstructorDescription}</p>
        </Link>

        <Link
          href="/admin"
          className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 transition hover:-translate-y-0.5"
        >
          <Trophy className="h-5 w-5 text-[var(--accent-2)]" />
          <h2 className="mt-3 text-lg font-semibold">{t.workspaceAdmin}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.workspaceAdminDescription}</p>
        </Link>
      </section>
    </main>
  );
}

