"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Filter, RefreshCw } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiClientError } from "@/lib/api/http";
import { useLanguage } from "@/components/providers/language-provider";
import { formatCoursePrice, getLearnerCopy } from "@/lib/i18n/learner";
import { useCheckoutCourse, useCourses } from "@/lib/hooks/use-courses";

function formatError(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function formatResultsCount(locale: "en" | "ru" | "kz", count: number) {
  if (locale === "ru") {
    const suffix = count === 1 ? "" : count >= 2 && count <= 4 ? "а" : "ов";
    return `Найден${count === 1 ? "" : "о"} ${count} курс${suffix}`;
  }
  if (locale === "kz") {
    return `${count} курс табылды`;
  }
  return `${count} course${count === 1 ? "" : "s"} found`;
}

function CourseSkeleton() {
  return (
    <Card className="overflow-hidden border-[var(--line)] bg-[var(--panel)]">
      <CardHeader className="space-y-3 pb-3">
        <div className="h-5 w-32 animate-pulse rounded-full bg-[var(--soft)]" />
        <div className="h-4 w-24 animate-pulse rounded-full bg-[var(--soft)]" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-4 w-full animate-pulse rounded-full bg-[var(--soft)]" />
        <div className="h-4 w-5/6 animate-pulse rounded-full bg-[var(--soft)]" />
        <div className="flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-[var(--soft)]" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-[var(--soft)]" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-[var(--soft)]" />
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-[var(--soft)]" />
        </div>
      </CardContent>
    </Card>
  );
}

function CoursesCatalogContent() {
  const { locale } = useLanguage();
  const copy = getLearnerCopy(locale);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [language, setLanguage] = useState("");

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      category: category.trim() || undefined,
      level: level.trim() || undefined,
      language: language.trim() || undefined,
      sortBy: "popular" as const,
      limit: 48,
    }),
    [search, category, level, language],
  );

  const { data: courses, isLoading, isError, error, refetch, isFetching } = useCourses(params);
  const checkout = useCheckoutCourse();
  const pendingCourseId = checkout.variables;
  const courseList = courses ?? [];
  const hasFilters = Boolean(search.trim() || category.trim() || level.trim() || language.trim());
  const checkoutError = checkout.isError
    ? formatError(checkout.error, copy.courses.checkoutErrorBody)
    : null;

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setLevel("");
    setLanguage("");
  };

  return (
    <AppShell title={copy.courses.title} subtitle={copy.courses.subtitle}>
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {copy.courses.filtersEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{copy.courses.filtersTitle}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{copy.courses.filtersDescription}</p>
          </div>
          <Button variant="outline" onClick={clearFilters} disabled={!hasFilters}>
            <Filter className="mr-2 h-4 w-4" />
            {copy.courses.resetFilters}
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              {copy.courses.search}
            </span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={copy.courses.search}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              {copy.courses.category}
            </span>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={copy.courses.category}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              {copy.courses.level}
            </span>
            <Input
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder={copy.courses.level}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              {copy.courses.language}
            </span>
            <Input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder={copy.courses.language}
            />
          </label>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          {isLoading ? copy.courses.resultsLoading : formatResultsCount(locale, courseList.length)}
        </p>
        <p className="text-xs text-[var(--muted)]">
          {isFetching && !isLoading ? copy.common.loading : copy.courses.sortedByPopularity}
        </p>
      </div>

      {checkoutError ? (
        <Card className="mt-4 border-amber-300/60 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-950">{copy.courses.checkoutErrorTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-900/80">{checkoutError}</p>
          </CardContent>
        </Card>
      ) : null}

      {checkout.isSuccess ? (
        <Card className="mt-4 border-emerald-300/60 bg-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-emerald-950">{copy.courses.checkoutSuccessTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {locale === "ru" ? (
              <p className="text-sm text-emerald-900/80">
                Ваш запрос принят. Откройте{" "}
                <Link href="/my-courses" className="font-semibold underline">
                  {copy.common.myCourses}
                </Link>{" "}
                , чтобы продолжить.
              </p>
            ) : locale === "kz" ? (
              <p className="text-sm text-emerald-900/80">
                Сұрауыңыз қабылданды. Жалғастыру үшін{" "}
                <Link href="/my-courses" className="font-semibold underline">
                  {copy.common.myCourses}
                </Link>{" "}
                бөліміне өтіңіз.
              </p>
            ) : (
              <p className="text-sm text-emerald-900/80">
                Your checkout request was accepted. Open{" "}
                <Link href="/my-courses" className="font-semibold underline">
                  {copy.common.myCourses}
                </Link>{" "}
                to continue.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {isError ? (
        <Card className="mt-4 border-amber-300/60 bg-amber-50">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
            <div>
              <CardTitle className="text-base text-amber-950">{copy.courses.catalogUnavailableTitle}</CardTitle>
              <p className="mt-1 text-sm text-amber-900/80">{formatError(error, copy.courses.catalogUnavailableBody)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {copy.common.retry}
            </Button>
          </CardHeader>
        </Card>
      ) : null}

      {!isLoading && !isError && courseList.length === 0 ? (
        <Card className="mt-4 border-dashed border-[var(--line)] bg-[var(--panel)]">
          <CardHeader>
            <CardTitle className="text-base">{copy.courses.noMatchesTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--muted)]">{copy.courses.noMatchesBody}</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={clearFilters} disabled={!hasFilters}>
                {copy.courses.clearFilters}
              </Button>
              <Link
                href="/my-courses"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
              >
                {copy.courses.myCoursesCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CourseSkeleton key={index} />
          ))}
        </section>
      ) : null}

      {!isLoading && !isError && courseList.length > 0 ? (
        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courseList.map((course) => {
            const tags = [course.category, course.level, course.language].filter(Boolean) as string[];
            const isPending = checkout.isPending;
            const isCurrentCheckout = pendingCourseId === course.id;

            return (
              <Card key={course.id} className="overflow-hidden border-[var(--line)] bg-[var(--panel)]">
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-lg leading-snug">{course.title}</CardTitle>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {tags.length > 0 ? tags.join(" / ") : copy.courses.courseMetaGeneral}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-2xl bg-[var(--accent)]/10 px-3 py-1 text-sm font-semibold text-[var(--accent)]">
                      {formatCoursePrice(locale, course.priceCents)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-3 text-sm text-[var(--muted)]">
                    {course.description ?? (locale === "ru" ? "Описание пока не добавлено." : locale === "kz" ? "Сипаттама әлі қосылмаған." : "No description provided yet.")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {course.category ? <Badge>{course.category}</Badge> : null}
                    {course.level ? <Badge>{course.level}</Badge> : null}
                    {course.language ? <Badge variant="success">{course.language}</Badge> : null}
                  </div>
                </CardContent>
                <div className="flex gap-2 px-5 pb-5">
                  <Button
                    type="button"
                    onClick={() => checkout.mutate(course.id)}
                    disabled={isPending}
                    className="flex-1"
                  >
                    {isPending && isCurrentCheckout ? copy.courses.processing : copy.courses.enroll}
                  </Button>
                  <Link
                    href={`/learn/${course.id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-2 text-sm font-semibold text-[var(--text)]"
                  >
                    {copy.courses.open}
                  </Link>
                </div>
              </Card>
            );
          })}
        </section>
      ) : null}
    </AppShell>
  );
}

export default function CoursesPage() {
  return (
    <AuthGuard>
      <CoursesCatalogContent />
    </AuthGuard>
  );
}
