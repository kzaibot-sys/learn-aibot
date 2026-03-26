'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Play,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Target,
  Zap,
} from 'lucide-react';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';
import { VideoPlayer } from '@/components/lms/VideoPlayer';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

/* ---------- types ---------- */

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  maxScore: number;
}

interface LessonDetail {
  id: string;
  title: string;
  type: string;
  videoUrl: string | null;
  content: string | null;
  description: string | null;
  duration: number | null;
  order: number;
  tasks: Task[];
  progress: {
    completed: boolean;
    watchedSec: number;
    completedAt: string | null;
  } | null;
}

interface LessonSummary {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  order: number;
  isFree: boolean;
}

interface ModuleSummary {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: LessonSummary[];
}

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  modules: ModuleSummary[];
}

interface ProgressLesson {
  lessonId: string;
  completed: boolean;
}

/* ---------- helpers ---------- */

function formatDuration(seconds: number | null): string {
  if (!seconds) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ---------- animation variants ---------- */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

/* ---------- component ---------- */

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;
  const token = useAuthStore((s) => s.token);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  /* flat list of all lessons in order */
  const allLessons = useMemo(() => {
    if (!course) return [];
    return course.modules
      .slice()
      .sort((a, b) => a.order - b.order)
      .flatMap((m) =>
        m.lessons.slice().sort((a, b) => a.order - b.order),
      );
  }, [course]);

  const currentIndex = useMemo(
    () => allLessons.findIndex((l) => l.id === lessonId),
    [allLessons, lessonId],
  );
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  /* data fetching */
  useEffect(() => {
    async function load() {
      try {
        const [lessonData, courseData] = await Promise.all([
          apiRequest<LessonDetail>(
            `/api/courses/${slug}/lessons/${lessonId}`,
            {},
            token,
          ),
          apiRequest<CourseDetail>(`/api/courses/${slug}`, {}, token),
        ]);
        setLesson(lessonData);
        setCourse(courseData);

        try {
          const progress = await apiRequest<{ lessons: ProgressLesson[] }>(
            `/api/progress/course/${courseData.id}`,
            {},
            token,
          );
          setCompletedLessons(
            new Set(
              progress.lessons
                .filter((l) => l.completed)
                .map((l) => l.lessonId),
            ),
          );
        } catch {
          // No progress yet
        }
      } catch (err) {
        console.error('Failed to load lesson:', err);
      } finally {
        setLoading(false);
      }
    }

    if (token) load();
  }, [slug, lessonId, token]);

  /* watchtime reporting */
  const handleTimeUpdate = useCallback(
    async (currentTime: number) => {
      try {
        await apiRequest(
          `/api/progress/lesson/${lessonId}/watchtime`,
          {
            method: 'PATCH',
            body: JSON.stringify({ watchedSec: currentTime }),
          },
          token,
        );
      } catch {
        // Silently fail watchtime updates
      }
    },
    [lessonId, token],
  );

  /* complete lesson */
  const handleComplete = useCallback(async () => {
    setCompleting(true);
    try {
      await apiRequest(
        `/api/progress/lesson/${lessonId}/complete`,
        { method: 'POST' },
        token,
      );
      setLesson((prev) =>
        prev
          ? {
              ...prev,
              progress: {
                completed: true,
                watchedSec: prev.progress?.watchedSec ?? 0,
                completedAt: new Date().toISOString(),
              },
            }
          : null,
      );
      setCompletedLessons((prev) => new Set(prev).add(lessonId));
    } catch (err) {
      console.error('Failed to complete:', err);
    } finally {
      setCompleting(false);
    }
  }, [lessonId, token]);

  /* navigate to a lesson */
  const goToLesson = (id: string) => {
    router.push(`/courses/${slug}/lessons/${id}`);
  };

  /* ---------- loading / error states ---------- */

  if (loading) {
    return (
      <AuthGuard>
        <Sidebar />
        <div className="ml-64">
          <TopBar />
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!lesson) {
    return (
      <AuthGuard>
        <Sidebar />
        <div className="ml-64">
          <TopBar />
          <div className="text-center py-20 text-muted-foreground">
            Урок не найден
          </div>
        </div>
      </AuthGuard>
    );
  }

  const isCompleted = lesson.progress?.completed || completedLessons.has(lessonId);
  const lessonNumber = currentIndex + 1;
  const totalLessons = allLessons.length;
  const taskCount = lesson.tasks.length;

  /* ---------- render ---------- */

  return (
    <AuthGuard>
      <Sidebar />
      <div className="ml-64">
        <TopBar />

        <main className="p-6">
          {/* Back link */}
          <Link
            href={`/courses/${slug}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Назад к курсу
          </Link>

          <div className="flex gap-6">
            {/* ====== LEFT COLUMN ====== */}
            <div className="flex-1 min-w-0" style={{ flex: '7' }}>
              {/* Video area */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="rounded-3xl overflow-hidden bg-black"
              >
                {lesson.videoUrl ? (
                  <VideoPlayer
                    src={lesson.videoUrl}
                    initialTime={lesson.progress?.watchedSec ?? 0}
                    onTimeUpdate={handleTimeUpdate}
                  />
                ) : (
                  <div className="w-full aspect-video flex flex-col items-center justify-center bg-zinc-900 text-muted-foreground">
                    <Play className="h-16 w-16 mb-3 opacity-30" />
                    <span className="text-sm opacity-50">
                      Видео недоступно
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Lesson meta */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="mt-6"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Урок {lessonNumber}
                  </span>
                  {lesson.duration && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(lesson.duration)}
                    </span>
                  )}
                  {isCompleted && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>

                <h1 className="mt-3 text-2xl font-bold text-foreground">
                  {lesson.title}
                </h1>

                {lesson.description && (
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    {lesson.description}
                  </p>
                )}
              </motion.div>

              {/* Content (HTML) */}
              {lesson.content && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={1}
                  className="mt-4 prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              )}

              {/* Info cards row */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                className="mt-6 grid grid-cols-3 gap-4"
              >
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Сложность</p>
                    <p className="text-sm font-medium text-foreground">
                      Средняя
                    </p>
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                    <BookOpen className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Задач</p>
                    <p className="text-sm font-medium text-foreground">
                      {taskCount} практики
                    </p>
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10">
                    <Zap className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Награда</p>
                    <p className="text-sm font-medium text-foreground">
                      +50 XP
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Complete / Test button */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
                className="mt-6"
              >
                <button
                  onClick={handleComplete}
                  disabled={isCompleted || completing}
                  className={`w-full rounded-2xl py-4 text-sm font-semibold transition-all ${
                    isCompleted
                      ? 'bg-green-500/20 text-green-400 cursor-default'
                      : 'bg-gradient-to-r from-primary via-accent to-orange-400 text-white hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50'
                  }`}
                >
                  {isCompleted
                    ? 'Урок выполнен'
                    : completing
                      ? 'Сохранение...'
                      : 'Завершить урок и пройти тест \u2192'}
                </button>
              </motion.div>

              {/* Navigation */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={4}
                className="mt-6 flex items-center justify-between"
              >
                {prevLesson ? (
                  <button
                    onClick={() => goToLesson(prevLesson.id)}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Предыдущий
                  </button>
                ) : (
                  <span />
                )}

                <span className="text-xs text-muted-foreground">
                  Урок {lessonNumber} из {totalLessons}
                </span>

                {nextLesson ? (
                  <button
                    onClick={() => goToLesson(nextLesson.id)}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Следующий
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <span />
                )}
              </motion.div>
            </div>

            {/* ====== RIGHT COLUMN (SIDEBAR) ====== */}
            <motion.aside
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="shrink-0"
              style={{ flex: '3' }}
            >
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-5 sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Содержание курса
                  </h2>
                </div>

                <div className="space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
                  {allLessons.map((item, idx) => {
                    const isActive = item.id === lessonId;
                    const isDone = completedLessons.has(item.id);

                    return (
                      <button
                        key={item.id}
                        onClick={() => goToLesson(item.id)}
                        className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all ${
                          isActive
                            ? 'border border-primary bg-primary/10'
                            : 'border border-transparent hover:bg-card/80'
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                            isDone
                              ? 'bg-green-500/20 text-green-500'
                              : isActive
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            idx + 1
                          )}
                        </span>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm truncate ${
                              isActive
                                ? 'font-medium text-foreground'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {item.title}
                          </p>
                          {item.duration && (
                            <p className="text-[11px] text-muted-foreground/60">
                              {formatDuration(item.duration)}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.aside>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
