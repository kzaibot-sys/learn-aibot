"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lock, PlayCircle, RefreshCw } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizLessonPanel } from "@/components/learn/quiz-lesson-panel";
import { VideoPlayer } from "@/components/video-player/video-player";
import { useLanguage } from "@/components/providers/language-provider";
import { api } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/api/config";
import { ApiClientError } from "@/lib/api/http";
import { getLearnerCopy } from "@/lib/i18n/learner";
import { useCourseCurriculum, useUpdateLessonProgress } from "@/lib/hooks/use-courses";

function formatError(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function LoadingPanel() {
  return (
    <article className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5">
      <div className="h-5 w-36 animate-pulse rounded-full bg-[var(--soft)]" />
      <div className="mt-3 h-4 w-64 animate-pulse rounded-full bg-[var(--soft)]" />
      <div className="mt-6 h-64 animate-pulse rounded-2xl bg-[var(--soft)]" />
      <div className="mt-4 h-14 animate-pulse rounded-2xl bg-[var(--soft)]" />
    </article>
  );
}

function LoadingSidebar() {
  return (
    <article className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5">
      <div className="h-5 w-24 animate-pulse rounded-full bg-[var(--soft)]" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-3">
            <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--line)]" />
            <div className="mt-3 h-10 animate-pulse rounded-xl bg-[var(--line)]" />
          </div>
        ))}
      </div>
    </article>
  );
}

type LessonPanelProps = {
  courseId: string;
  lessonId: string;
  lesson: {
    id: string;
    title: string;
    type: "VIDEO" | "TEXT" | "QUIZ";
    contentUrl?: string | null;
    progress?: {
      watchedDuration: number;
      completed: boolean;
      quizScore?: number | null;
    } | null;
  };
  selectedLessonMeta: {
    completed: boolean;
    unlocked: boolean;
  } | null;
  updateProgress: ReturnType<typeof useUpdateLessonProgress>;
  copy: ReturnType<typeof getLearnerCopy>;
};

function LessonPanel({
  courseId,
  lessonId,
  lesson,
  selectedLessonMeta,
  updateProgress,
  copy,
}: LessonPanelProps) {
  const [seconds, setSeconds] = useState(() => lesson.progress?.watchedDuration ?? 0);
  const resumeTime = lesson.progress?.watchedDuration ?? 0;
  const streamUrl = (() => {
    const source = lesson.contentUrl?.trim();
    if (!source) {
      return "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    }
    if (source.startsWith("http://") || source.startsWith("https://")) {
      return source;
    }
    if (source.startsWith("/")) {
      const apiBase = getApiBaseUrl();
      const origin = apiBase.replace(/\/api\/v1$/, "");
      return `${origin}${source}`;
    }
    return source;
  })();

  if (lesson.type === "QUIZ") {
    return (
      <QuizLessonPanel
        key={lessonId}
        courseId={courseId}
        lessonId={lessonId}
        lessonTitle={lesson.title}
        progress={lesson.progress}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            {copy.player.currentLesson}
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">{lesson.title}</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {selectedLessonMeta?.completed
              ? copy.player.lessonCompleted
              : selectedLessonMeta?.unlocked
                ? copy.player.lessonReady
                : copy.player.lessonLocked}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--soft)] px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{copy.player.watchTime}</p>
          <p className="mt-1 text-lg font-semibold">{seconds}s</p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-black">
        <VideoPlayer
          src={streamUrl}
          onProgress={(time) => setSeconds(Math.floor(time))}
          resumeTime={resumeTime}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium">{lesson.title}</p>
          <p className="text-xs text-[var(--muted)]">{copy.player.resumeHint}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() =>
              updateProgress.mutate({
                lessonId,
                watchedDuration: seconds,
                completed: seconds >= 120,
              })
            }
            disabled={updateProgress.isPending}
          >
            {updateProgress.isPending ? copy.player.saving : copy.player.saveProgress}
          </Button>
        </div>
      </div>

      {updateProgress.isError ? (
        <p className="mt-3 text-sm text-rose-600">
          {formatError(updateProgress.error, copy.player.lessonCouldNotLoadBody)}
        </p>
      ) : null}
    </>
  );
}

function formatUnlockedCounter(locale: "en" | "ru" | "kz", unlocked: number, total: number) {
  if (locale === "ru") {
    return `${unlocked}/${total} открыто`;
  }
  if (locale === "kz") {
    return `${unlocked}/${total} ашық`;
  }
  return `${unlocked}/${total} unlocked`;
}

function formatModuleLessons(locale: "en" | "ru" | "kz", count: number) {
  if (locale === "ru") {
    return `Уроков: ${count}`;
  }
  if (locale === "kz") {
    return `${count} сабақ`;
  }
  return `${count} lessons`;
}

function CoursePlayerView({ courseId }: { courseId: string }) {
  const { locale } = useLanguage();
  const copy = getLearnerCopy(locale);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const updateProgress = useUpdateLessonProgress();
  const curriculum = useCourseCurriculum(courseId);

  const lessons = useMemo(
    () => curriculum.data?.modules.flatMap((module) => module.lessons) ?? [],
    [curriculum.data],
  );

  const selectedLessonId = useMemo(() => {
    if (activeLessonId) {
      return activeLessonId;
    }
    return lessons.find((item) => item.unlocked)?.id ?? null;
  }, [activeLessonId, lessons]);

  const selectedLessonMeta = lessons.find((item) => item.id === selectedLessonId) ?? null;

  const lesson = useQuery({
    queryKey: ["lesson", selectedLessonId],
    queryFn: () => api.lessons.getById(selectedLessonId as string),
    enabled: Boolean(selectedLessonId),
  });

  const currentLessonError = lesson.isError
    ? formatError(lesson.error, copy.player.lessonCouldNotLoadBody)
    : null;
  const curriculumError = curriculum.isError
    ? formatError(curriculum.error, copy.player.courseCurriculumUnavailableBody)
    : null;
  const unlockedCount = lessons.filter((item) => item.unlocked).length;
  const completedCount = lessons.filter((item) => item.completed).length;

  return (
    <AppShell title={curriculum.data?.title ?? copy.player.title} subtitle={curriculum.data?.description ?? copy.player.subtitle}>
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5">
        {curriculum.isLoading ? (
          <>
            <div className="h-5 w-40 animate-pulse rounded-full bg-[var(--soft)]" />
            <div className="mt-3 h-4 w-72 animate-pulse rounded-full bg-[var(--soft)]" />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl bg-[var(--soft)] p-4">
                  <div className="h-3 w-20 animate-pulse rounded-full bg-[var(--line)]" />
                  <div className="mt-2 h-6 w-16 animate-pulse rounded-full bg-[var(--line)]" />
                </div>
              ))}
            </div>
          </>
        ) : curriculumError ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-950">{copy.player.courseCurriculumUnavailableTitle}</p>
              <p className="mt-1 text-sm text-amber-900/80">{curriculumError}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={() => curriculum.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {copy.common.retry}
              </Button>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
              >
                {copy.player.backToCatalog}
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                {copy.player.courseProgressEyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {curriculum.data?.title ?? copy.player.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {curriculum.data?.description ?? copy.player.courseProgressDescription}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[280px]">
              <div className="rounded-2xl bg-[var(--soft)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{copy.player.progress}</p>
                <p className="mt-2 text-2xl font-semibold">
                  {Math.round(curriculum.data?.progress ?? 0)}%
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--soft)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{copy.player.lessons}</p>
                <p className="mt-2 text-2xl font-semibold">
                  {completedCount}/{lessons.length || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--soft)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{copy.player.unlocked}</p>
                <p className="mt-2 text-2xl font-semibold">{unlockedCount}</p>
              </div>
              <div className="rounded-2xl bg-[var(--soft)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{copy.player.current}</p>
                <p className="mt-2 text-2xl font-semibold">{selectedLessonMeta ? "1" : "0"}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {curriculum.isLoading ? (
        <section className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <LoadingPanel />
          <LoadingSidebar />
        </section>
      ) : curriculumError ? null : lessons.length === 0 ? (
        <Card className="mt-5 border-dashed border-[var(--line)] bg-[var(--panel)]">
          <CardHeader>
            <CardTitle className="text-base">{copy.player.noLessonsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--muted)]">{copy.player.noLessonsBody}</p>
            <Link
              href="/courses"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
            >
              {copy.player.browseCatalog}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <section className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <article className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5">
            {!selectedLessonId ? (
              <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft)] p-5">
                <p className="text-sm font-semibold">{copy.player.noUnlockedLessonTitle}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{copy.player.noUnlockedLessonBody}</p>
              </div>
            ) : lesson.isLoading ? (
              <div className="space-y-4">
                <div className="h-6 w-48 animate-pulse rounded-full bg-[var(--soft)]" />
                <div className="h-4 w-72 animate-pulse rounded-full bg-[var(--soft)]" />
                <div className="h-72 animate-pulse rounded-2xl bg-[var(--soft)]" />
                <p className="text-sm text-[var(--muted)]">{copy.player.lessonLoading}</p>
              </div>
            ) : currentLessonError ? (
              <div className="rounded-2xl border border-amber-300/60 bg-amber-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-950">{copy.player.lessonCouldNotLoadTitle}</p>
                    <p className="mt-1 text-sm text-amber-900/80">{currentLessonError}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => lesson.refetch()}>
                    {copy.common.retry}
                  </Button>
                </div>
              </div>
            ) : lesson.data ? (
              <LessonPanel
                key={selectedLessonId}
                courseId={courseId}
                lessonId={selectedLessonId}
                lesson={lesson.data}
                selectedLessonMeta={selectedLessonMeta}
                updateProgress={updateProgress}
                copy={copy}
              />
            ) : null}
          </article>

          <article className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {copy.player.lessonsHeader}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {formatUnlockedCounter(locale, unlockedCount, lessons.length)}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--soft)] px-3 py-2 text-xs font-medium text-[var(--muted)]">
                {copy.player.courseId}: {courseId}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {curriculum.data?.modules.map((module) => (
                <div key={module.id} className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{module.title}</p>
                    <span className="text-xs text-[var(--muted)]">
                      {formatModuleLessons(locale, module.lessons.length)}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {module.lessons.map((item) => {
                      const active = selectedLessonId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => item.unlocked && setActiveLessonId(item.id)}
                          disabled={!item.unlocked}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                            active
                              ? "border-[var(--accent)] bg-[var(--accent)]/10"
                              : "border-[var(--line)] bg-white/70 hover:border-[var(--accent)]/40"
                          } ${!item.unlocked ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <span className="min-w-0 truncate">
                            {item.order}. {item.title}
                          </span>
                          {item.unlocked ? (
                            <PlayCircle className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                          ) : (
                            <Lock className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {selectedLessonMeta ? (
              <p className="mt-4 text-xs text-[var(--muted)]">
                {selectedLessonMeta.completed
                  ? copy.player.lessonCompleted
                  : selectedLessonMeta.unlocked
                    ? copy.player.lessonReady
                    : copy.player.lessonLocked}
              </p>
            ) : null}
          </article>
        </section>
      )}
    </AppShell>
  );
}

export function CoursePlayerClient({ courseId }: { courseId: string }) {
  return (
    <AuthGuard>
      <CoursePlayerView key={courseId} courseId={courseId} />
    </AuthGuard>
  );
}
