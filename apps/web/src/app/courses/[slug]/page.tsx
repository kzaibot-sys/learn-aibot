'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  ChevronLeft,
  Users,
  GraduationCap,
  Layers,
  Lock,
} from 'lucide-react';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';

/* ---------- types ---------- */

interface Lesson {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  order: number;
  isFree: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
}

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  modules: Module[];
}

interface ProgressData {
  completedLessons: number;
  lessons: { lessonId: string; completed: boolean }[];
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

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* ---------- component ---------- */

export default function CoursePage() {
  const params = useParams();
  const slug = params.slug as string;
  const token = useAuthStore((s) => s.token);
  const { t } = useI18n();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest<CourseDetail>(`/api/courses/${slug}`, {}, token);
        setCourse(data);

        try {
          const prog = await apiRequest<ProgressData>(
            `/api/progress/course/${data.id}`,
            {},
            token,
          );
          setProgress(prog);
          setCompletedSet(
            new Set(prog.lessons.filter((l) => l.completed).map((l) => l.lessonId)),
          );
          setEnrolled(true);
        } catch {
          // Not enrolled or no progress
          setEnrolled(false);
        }
      } catch (err) {
        console.error('Failed to load course:', err);
      } finally {
        setLoading(false);
      }
    }

    if (token) load();
  }, [slug, token]);

  /* computed stats */
  const totalLessons = useMemo(() => {
    if (!course) return 0;
    return course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  }, [course]);

  const totalDuration = useMemo(() => {
    if (!course) return 0;
    return course.modules.reduce(
      (sum, m) => sum + m.lessons.reduce((s, l) => s + (l.duration ?? 0), 0),
      0,
    );
  }, [course]);

  const progressPercent = useMemo(() => {
    if (!totalLessons || !progress) return 0;
    return Math.round((progress.completedLessons / totalLessons) * 100);
  }, [totalLessons, progress]);

  /* ---------- loading state ---------- */
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

  /* ---------- not found ---------- */
  if (!course) {
    return (
      <AuthGuard>
        <Sidebar />
        <div className="ml-64">
          <TopBar />
          <div className="text-center py-20 text-muted-foreground">
            Курс не найден
          </div>
        </div>
      </AuthGuard>
    );
  }

  const sortedModules = course.modules.slice().sort((a, b) => a.order - b.order);

  /* ---------- render ---------- */
  return (
    <AuthGuard>
      <Sidebar />
      <div className="ml-64">
        <TopBar />

        <main className="p-6 max-w-5xl">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('common.backToCourses')}
            </Link>
          </motion.div>

          {/* ====== HERO SECTION ====== */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="mt-6 rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-accent/5 to-orange-400/5 backdrop-blur-sm p-8"
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {course.modules.length} {course.modules.length === 1 ? 'модуль' : course.modules.length < 5 ? 'модуля' : 'модулей'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    <BookOpen className="h-3.5 w-3.5" />
                    {totalLessons} {t('courses.lessons').toLowerCase()}
                  </span>
                  {totalDuration > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
                      <Clock className="h-3.5 w-3.5" />
                      {totalDuration} {t('common.min')}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-foreground leading-tight">
                  {course.title}
                </h1>

                {course.description && (
                  <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl">
                    {course.description}
                  </p>
                )}

                {/* Progress bar (enrolled) or price (not enrolled) */}
                <div className="mt-6">
                  {enrolled && progress ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          {progress.completedLessons} / {totalLessons} уроков завершено
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                          className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-orange-400"
                        />
                      </div>
                      <Link
                        href={`/courses/${slug}/lessons/${findNextLesson(sortedModules, completedSet)}`}
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-accent to-orange-400 px-8 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/25 transition-all"
                      >
                        <Play className="h-4 w-4" />
                        {t('courses.continue')}
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {course.price != null && course.price > 0 ? (
                        <>
                          <span className="text-2xl font-bold text-foreground">
                            {Number(course.price).toLocaleString('ru-RU')} &#8381;
                          </span>
                          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-accent to-orange-400 px-8 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/25 transition-all">
                            Купить курс
                          </button>
                        </>
                      ) : (
                        <Link
                          href={`/courses/${slug}/lessons/${findFirstLesson(sortedModules)}`}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-accent to-orange-400 px-8 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/25 transition-all"
                        >
                          <Play className="h-4 w-4" />
                          Начать обучение
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ====== MODULES LIST ====== */}
          <div className="mt-8 space-y-6">
            {sortedModules.map((mod, modIdx) => {
              const sortedLessons = mod.lessons.slice().sort((a, b) => a.order - b.order);
              const moduleDone = sortedLessons.every((l) => completedSet.has(l.id));
              const moduleCompletedCount = sortedLessons.filter((l) => completedSet.has(l.id)).length;

              return (
                <motion.div
                  key={mod.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={modIdx + 1}
                >
                  {/* Module header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        moduleDone
                          ? 'bg-green-500/10'
                          : 'bg-primary/10'
                      }`}
                    >
                      {moduleDone ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Layers className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-foreground">
                        {mod.title}
                      </h2>
                      {mod.description && (
                        <p className="text-sm text-muted-foreground">{mod.description}</p>
                      )}
                    </div>
                    {enrolled && (
                      <span className="text-xs text-muted-foreground">
                        {moduleCompletedCount}/{sortedLessons.length}
                      </span>
                    )}
                  </div>

                  {/* Lessons */}
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-2"
                  >
                    {sortedLessons.map((lesson, lessonIdx) => {
                      const isDone = completedSet.has(lesson.id);

                      return (
                        <motion.div key={lesson.id} variants={staggerItem}>
                          <Link
                            href={`/courses/${slug}/lessons/${lesson.id}`}
                            className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm px-5 py-4 hover:border-primary/30 hover:bg-card/80 transition-all"
                          >
                            {/* Icon */}
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                isDone
                                  ? 'bg-green-500/15 text-green-500'
                                  : 'bg-secondary/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </div>

                            {/* Title and meta */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {lesson.title}
                              </p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs text-muted-foreground capitalize">
                                  {lesson.type === 'VIDEO' ? 'Видео' : lesson.type === 'TEXT' ? 'Текст' : lesson.type === 'QUIZ' ? 'Тест' : lesson.type.toLowerCase()}
                                </span>
                                {lesson.isFree && (
                                  <span className="text-xs text-green-500 font-medium">
                                    Бесплатно
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Duration */}
                            {lesson.duration != null && lesson.duration > 0 && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{lesson.duration} {t('common.min')}</span>
                              </div>
                            )}

                            {/* Status indicator */}
                            {!enrolled && !lesson.isFree && (
                              <Lock className="h-4 w-4 text-muted-foreground/50" />
                            )}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

/* ---------- helpers ---------- */

function findFirstLesson(modules: Module[]): string {
  for (const mod of modules) {
    const sorted = mod.lessons.slice().sort((a, b) => a.order - b.order);
    if (sorted.length > 0) return sorted[0].id;
  }
  return '';
}

function findNextLesson(modules: Module[], completedSet: Set<string>): string {
  for (const mod of modules) {
    const sorted = mod.lessons.slice().sort((a, b) => a.order - b.order);
    for (const lesson of sorted) {
      if (!completedSet.has(lesson.id)) return lesson.id;
    }
  }
  // All done, return first lesson
  return findFirstLesson(modules);
}
