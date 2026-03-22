"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  Flame,
  GraduationCap,
  Layers3,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api/http";
import { useLanguage } from "@/components/providers/language-provider";
import { getLearnerCopy } from "@/lib/i18n/learner";
import { useDashboardSummary, useGamification, useMe } from "@/lib/hooks/use-auth";

function formatError(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function formatXpLevel(locale: "en" | "ru" | "kz", xp: number, level: number) {
  if (locale === "ru") {
    return `${xp} XP · Уровень ${level}`;
  }
  if (locale === "kz") {
    return `${xp} XP · Деңгей ${level}`;
  }
  return `${xp} XP · Level ${level}`;
}

function formatSeries(locale: "en" | "ru" | "kz", days: number) {
  if (locale === "ru") {
    return `${days} дн.`;
  }
  if (locale === "kz") {
    return `${days} күн`;
  }
  return `${days}d`;
}

function LoadingStatCard() {
  return (
    <article className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="h-4 w-28 animate-pulse rounded-full bg-[var(--soft)]" />
      <div className="mt-4 h-8 w-20 animate-pulse rounded-2xl bg-[var(--soft)]" />
      <div className="mt-3 h-3 w-24 animate-pulse rounded-full bg-[var(--soft)]" />
    </article>
  );
}

function HeroAction({
  href,
  label,
  emphasis = false,
}: {
  href: string;
  label: string;
  emphasis?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
        emphasis
          ? "bg-[var(--accent)] text-white shadow-[0_10px_30px_-12px_var(--accent)]"
          : "border border-[var(--line)] bg-[var(--soft)] text-[var(--text)] hover:border-[var(--accent)]/40",
      ].join(" ")}
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function DashboardPageContent() {
  const { locale } = useLanguage();
  const copy = getLearnerCopy(locale);
  const { data: me } = useMe();
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErrorValue,
    refetch: refetchSummary,
  } = useDashboardSummary();
  const {
    data: gamification,
    isLoading: gameLoading,
    isError: gameError,
    error: gameErrorValue,
    refetch: refetchGamification,
  } = useGamification();

  const welcomeName = me?.firstName ? `, ${me.firstName}` : "";
  const summaryProblem = summaryError
    ? formatError(summaryErrorValue, copy.dashboard.summaryUnavailableBody)
    : null;
  const gameProblem = gameError
    ? formatError(gameErrorValue, copy.dashboard.gamificationUnavailableBody)
    : null;

  const stats = [
    {
      label: copy.dashboard.enrolledCourses,
      value: summary?.stats.enrolledCourses ?? 0,
      icon: Layers3,
      loading: summaryLoading,
      error: summaryError,
      hint: copy.dashboard.enrolledCoursesHint,
    },
    {
      label: copy.dashboard.completedCourses,
      value: summary?.stats.completedCourses ?? 0,
      icon: GraduationCap,
      loading: summaryLoading,
      error: summaryError,
      hint: copy.dashboard.completedCoursesHint,
    },
    {
      label: copy.dashboard.averageProgress,
      value: `${summary?.stats.averageProgress ?? 0}%`,
      icon: Zap,
      loading: summaryLoading,
      error: summaryError,
      hint: copy.dashboard.averageProgressHint,
    },
    {
      label: copy.dashboard.currentStreak,
      value: formatSeries(locale, gamification?.streakDays ?? 0),
      icon: Flame,
      loading: gameLoading,
      error: gameError,
      hint: copy.dashboard.currentStreakHint,
    },
  ];

  return (
    <AppShell title={`${copy.dashboard.title}${welcomeName}`} subtitle={copy.dashboard.subtitle}>
      <section className="rounded-3xl border border-[var(--line)] bg-[linear-gradient(135deg,rgba(99,102,241,0.08),rgba(14,165,233,0.06))] p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {copy.dashboard.heroEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{copy.dashboard.heroTitle}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{copy.dashboard.heroDescription}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <HeroAction href="/courses" label={copy.common.browseCatalog} emphasis />
            <HeroAction href="/my-courses" label={copy.common.myCourses} />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryLoading || gameLoading ? (
          <>
            <LoadingStatCard />
            <LoadingStatCard />
            <LoadingStatCard />
            <LoadingStatCard />
          </>
        ) : (
          stats.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.label}
                className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-[var(--muted)]">{item.label}</p>
                  <Icon className="h-4 w-4 text-[var(--accent)]" />
                </div>
                {item.loading ? (
                  <div className="mt-4 h-8 w-20 animate-pulse rounded-2xl bg-[var(--soft)]" />
                ) : item.error ? (
                  <p className="mt-3 text-sm font-medium text-amber-600">{copy.common.unavailable}</p>
                ) : (
                  <p className="mt-3 text-3xl font-semibold tracking-tight">{item.value}</p>
                )}
                <p className="mt-2 text-xs text-[var(--muted)]">{item.hint}</p>
              </article>
            );
          })
        )}
      </section>

      {summaryProblem || gameProblem ? (
        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          {summaryProblem ? (
            <article className="rounded-3xl border border-amber-300/60 bg-amber-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-950">
                    {copy.dashboard.summaryUnavailableTitle}
                  </p>
                  <p className="mt-1 text-sm text-amber-900/80">{summaryProblem}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchSummary()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {copy.common.retry}
                </Button>
              </div>
            </article>
          ) : null}

          {gameProblem ? (
            <article className="rounded-3xl border border-amber-300/60 bg-amber-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-950">
                    {copy.dashboard.gamificationUnavailableTitle}
                  </p>
                  <p className="mt-1 text-sm text-amber-900/80">{gameProblem}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchGamification()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {copy.common.retry}
                </Button>
              </div>
            </article>
          ) : null}
        </section>
      ) : null}

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{copy.dashboard.continueTitle}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{copy.dashboard.continueSubtitle}</p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm font-medium"
            >
              {copy.common.browseCatalog}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {summaryLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4"
                >
                  <div className="h-4 w-44 animate-pulse rounded-full bg-[var(--line)]" />
                  <div className="mt-3 h-3 w-28 animate-pulse rounded-full bg-[var(--line)]" />
                  <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-[var(--line)]" />
                </div>
              ))}
            </div>
          ) : summaryError ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft)] p-4">
              <p className="text-sm text-[var(--muted)]">{copy.dashboard.summaryUnavailableBody}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchSummary()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {copy.common.retry}
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {(summary?.enrollments ?? []).slice(0, 6).map((item) => {
                const progress = Math.max(0, Math.min(100, Math.round(item.progress)));
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{item.course.title}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{progress}% {locale === "ru" ? "завершено" : locale === "kz" ? "аяқталды" : "complete"}</p>
                      </div>
                      <Link
                        href={`/learn/${item.course.id}`}
                        className="inline-flex shrink-0 items-center rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white"
                      >
                        {copy.dashboard.openLesson}
                      </Link>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {(summary?.enrollments ?? []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft)] p-4">
                  <p className="text-sm text-[var(--muted)]">{copy.dashboard.noEnrollmentsBody}</p>
                  <Link
                    href="/courses"
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
                  >
                    {copy.dashboard.findCourse}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : null}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{copy.dashboard.achievementsTitle}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{copy.dashboard.achievementsSubtitle}</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-2 text-[var(--accent)]">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>

          {gameLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4"
                >
                  <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--line)]" />
                  <div className="mt-2 h-3 w-48 animate-pulse rounded-full bg-[var(--line)]" />
                </div>
              ))}
            </div>
          ) : gameError ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft)] p-4">
              <p className="text-sm text-[var(--muted)]">{copy.dashboard.gamificationUnavailableBody}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchGamification()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {copy.common.retry}
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[var(--accent)]/15 p-2 text-[var(--accent)]">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted)]">XP and level</p>
                    <p className="text-lg font-semibold">
                      {formatXpLevel(locale, gamification?.xp ?? 0, gamification?.level ?? 1)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="text-xs text-[var(--muted)]">{copy.dashboard.currentStreakLabel}</p>
                    <p className="mt-1 font-semibold">{formatSeries(locale, gamification?.streakDays ?? 0)}</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="text-xs text-[var(--muted)]">{copy.dashboard.longestStreakLabel}</p>
                    <p className="mt-1 font-semibold">{formatSeries(locale, gamification?.longestStreak ?? 0)}</p>
                  </div>
                </div>
              </div>

              {(gamification?.achievements ?? []).slice(0, 5).map((item) => (
                <div
                  key={`${item.key}-${item.awardedAt}`}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{item.description}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {copy.dashboard.awardedXp.replace("{xp}", String(item.xpReward))}
                  </p>
                </div>
              ))}

              {(gamification?.achievements ?? []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft)] p-4">
                  <p className="text-sm text-[var(--muted)]">{copy.dashboard.noAchievementsBody}</p>
                  <Link
                    href="/courses"
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
                  >
                    {copy.dashboard.findCourse}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : null}
            </div>
          )}
        </article>
      </section>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardPageContent />
    </AuthGuard>
  );
}
