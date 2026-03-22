"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClientError } from "@/lib/api/http";
import { useLanguage } from "@/components/providers/language-provider";
import { formatCoursePrice, getLearnerCopy } from "@/lib/i18n/learner";
import { useMyEnrollments } from "@/lib/hooks/use-courses";

function formatError(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function CourseSkeleton() {
  return (
    <Card className="overflow-hidden border-[var(--line)] bg-[var(--panel)]">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="h-5 w-40 animate-pulse rounded-full bg-[var(--soft)]" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-[var(--soft)]" />
        </div>
        <div className="h-4 w-24 animate-pulse rounded-full bg-[var(--soft)]" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-2 w-full animate-pulse rounded-full bg-[var(--soft)]" />
        <div className="flex justify-between gap-3">
          <div className="h-3 w-20 animate-pulse rounded-full bg-[var(--soft)]" />
          <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--soft)]" />
        </div>
        <div className="h-10 w-full animate-pulse rounded-xl bg-[var(--soft)]" />
      </CardContent>
    </Card>
  );
}

function MyCoursesContent() {
  const { locale } = useLanguage();
  const copy = getLearnerCopy(locale);
  const { data, isLoading, isFetching, isError, error, refetch } = useMyEnrollments();
  const courses = data ?? [];
  const completedCount = courses.filter((item) => (item.progressPercent ?? 0) >= 100).length;
  const activeCount = Math.max(courses.length - completedCount, 0);
  const hasCourses = courses.length > 0;
  const errorMessage = isError ? formatError(error, copy.myCourses.errorBody) : null;

  return (
    <AppShell title={copy.myCourses.title} subtitle={copy.myCourses.subtitle}>
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {copy.myCourses.queueEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{copy.myCourses.queueTitle}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{copy.myCourses.queueDescription}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => refetch()}>
              {copy.myCourses.refresh}
            </Button>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
            >
              {copy.myCourses.browseCatalog}
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[var(--soft)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              {copy.myCourses.enrollments}
            </p>
            <p className="mt-2 text-2xl font-semibold">{courses.length}</p>
          </div>
          <div className="rounded-2xl bg-[var(--soft)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              {copy.myCourses.inProgress}
            </p>
            <p className="mt-2 text-2xl font-semibold">{activeCount}</p>
          </div>
          <div className="rounded-2xl bg-[var(--soft)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              {copy.myCourses.completed}
            </p>
            <p className="mt-2 text-2xl font-semibold">{completedCount}</p>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <Card className="mt-5 border-amber-300/60 bg-amber-50">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
            <div>
              <CardTitle className="text-base text-amber-950">{copy.myCourses.errorTitle}</CardTitle>
              <p className="mt-1 text-sm text-amber-900/80">{errorMessage}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {copy.common.retry}
            </Button>
          </CardHeader>
        </Card>
      ) : null}

      {isLoading ? (
        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CourseSkeleton key={index} />
          ))}
        </section>
      ) : null}

      {!isLoading && !isError && !hasCourses ? (
        <Card className="mt-5 border-dashed border-[var(--line)] bg-[var(--panel)]">
          <CardHeader>
            <CardTitle className="text-base">{copy.myCourses.noCoursesTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--muted)]">{copy.myCourses.noCoursesBody}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
              >
                {copy.myCourses.browseCatalog}
              </Link>
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                {copy.myCourses.refresh}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && hasCourses ? (
        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((item) => {
            const progress = Math.max(0, Math.min(100, Math.round(item.progressPercent ?? 0)));
            const title = item.course?.title ?? item.courseTitle ?? `Course ${item.courseId}`;
            const course = item.course;
            const subtitle = [course?.category, course?.level, course?.language]
              .filter(Boolean)
              .join(" / ");
            const statusLabel = progress >= 100 ? copy.myCourses.completedLabel : copy.myCourses.inProgressLabel;

            return (
              <Card key={item.id} className="overflow-hidden border-[var(--line)] bg-[var(--panel)]">
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-lg leading-snug">{title}</CardTitle>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {subtitle || copy.myCourses.courseSubtitleGeneral}
                      </p>
                    </div>
                    <Badge variant={progress >= 100 ? "success" : "default"}>{progress}%</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--soft)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
                    <span>{statusLabel}</span>
                    <span>
                      {course?.priceCents && course.priceCents > 0
                        ? formatCoursePrice(locale, course.priceCents)
                        : copy.myCourses.freeCourse}
                    </span>
                  </div>
                  <Link
                    href={`/learn/${item.courseId}`}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
                  >
                    {copy.myCourses.continue}
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ) : null}
    </AppShell>
  );
}

export default function MyCoursesPage() {
  return (
    <AuthGuard>
      <MyCoursesContent />
    </AuthGuard>
  );
}
