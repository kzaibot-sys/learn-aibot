"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCourseRecommendations } from "@/lib/hooks/use-courses";
import { ApiClientError } from "@/lib/api/http";

const MAX_DISPLAY = 6;
const MIN_GRID = 3;

type Variant = "landing" | "dashboard";

function CourseCardBody({
  title,
  category,
  level,
  courseId,
}: {
  title: string;
  category?: string | null;
  level?: string | null;
  courseId: string;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {level && (
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-primary">
            {level}
          </span>
        )}
        {category && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {category}
          </span>
        )}
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug">{title}</h3>
      <Link
        href={`/learn/${courseId}`}
        className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
      >
        Открыть курс
      </Link>
    </>
  );
}

function LoadingSkeleton({ variant }: { variant: Variant }) {
  const cards = Array.from({ length: MIN_GRID });
  if (variant === "landing") {
    return (
      <div className="grid gap-5 lg:grid-cols-3">
        {cards.map((_, i) => (
          <article
            key={i}
            className="rounded-2xl bg-white p-5 ring-1 ring-slate-100"
          >
            <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-4 w-24 animate-pulse rounded bg-slate-200" />
          </article>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-transparent bg-slate-50/80 p-4"
        >
          <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-5 w-full animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-20 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function RecommendedCoursesSection({ variant = "landing" }: { variant?: Variant }) {
  const { data, isLoading, isError, error } = useCourseRecommendations();
  const courses = (data ?? []).slice(0, MAX_DISPLAY);

  const errorMessage =
    error instanceof ApiClientError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Не удалось загрузить рекомендации.";

  if (variant === "landing") {
    return (
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Рекомендуем</h2>
          <Link href="/courses" className="text-sm font-medium text-primary">
            Все курсы
          </Link>
        </div>

        {isLoading && (
          <>
            <LoadingSkeleton variant="landing" />
            <p className="text-sm text-muted-foreground">Загрузка рекомендаций...</p>
          </>
        )}

        {isError && (
          <div className="rounded-2xl bg-white p-5 ring-1 ring-destructive/30">
            <p className="text-sm font-medium text-destructive">{errorMessage}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Проверьте, что backend отдаёт{" "}
              <code className="rounded bg-muted px-1 py-0.5">GET /courses/recommendations</code>.
            </p>
            <Link href="/courses" className="mt-3 inline-block text-sm font-semibold text-primary">
              Перейти в каталог
            </Link>
          </div>
        )}

        {!isLoading && !isError && courses.length === 0 && (
          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
            <p className="text-sm text-muted-foreground">
              Пока нет персональных рекомендаций — загляните в каталог и выберите курс.
            </p>
            <Link href="/courses" className="mt-3 inline-block text-sm font-semibold text-primary">
              Смотреть каталог
            </Link>
          </div>
        )}

        {!isLoading && !isError && courses.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course.id}
                className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <CourseCardBody
                  courseId={course.id}
                  title={course.title}
                  category={course.category}
                  level={course.level}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mt-8">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" />
            Рекомендуем
          </CardTitle>
          <Link href="/courses" className="text-sm font-medium text-primary">
            Каталог
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <>
              <LoadingSkeleton variant="dashboard" />
              <p className="text-sm text-muted-foreground">Загрузка рекомендаций...</p>
            </>
          )}

          {isError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Endpoint:{" "}
                <code className="rounded bg-muted px-1 py-0.5">GET /courses/recommendations</code>
              </p>
              <Link href="/courses" className="mt-2 inline-block text-sm font-semibold text-primary">
                Открыть каталог
              </Link>
            </div>
          )}

          {!isLoading && !isError && courses.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Пока нет рекомендаций.{" "}
              <Link href="/courses" className="font-semibold text-primary hover:underline">
                Выберите курс в каталоге
              </Link>
              .
            </p>
          )}

          {!isLoading && !isError && courses.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <div className="flex flex-wrap gap-2">
                    {course.level && <Badge>{course.level}</Badge>}
                    {course.category && (
                      <Badge className="bg-slate-100 text-muted-foreground">{course.category}</Badge>
                    )}
                  </div>
                  <p className="mt-3 font-medium leading-snug">{course.title}</p>
                  <Link
                    href={`/learn/${course.id}`}
                    className="mt-3 text-sm font-semibold text-primary hover:underline"
                  >
                    Перейти к курсу
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
