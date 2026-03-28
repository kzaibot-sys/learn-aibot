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
  Award,
} from 'lucide-react';
import { SkeletonCourseDetail } from '@/components/ui/Skeleton';
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
    return <SkeletonCourseDetail />;
  }

  /* ---------- not found ---------- */
  if (!course) {
    return <div className="text-center py-20 text-muted-foreground">{t('lesson.courseNotFound')}</div>;
  }

  const sortedModules = course.modules.slice().sort((a, b) => a.order - b.order);

  /* ---------- render ---------- */
  return (
    <div className="max-w-5xl">
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
            className="mt-6 rounded-3xl border border-border/50 bg-gradient-to-br from-orange-500/5 via-orange-400/5 to-orange-400/5 backdrop-blur-sm p-4 sm:p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-primary">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {course.modules.length} {course.modules.length === 1 ? t('courses.moduleWord') : course.modules.length < 5 ? t('courses.modulesWord2') : t('courses.modulesWord5')}
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

                {/* Progress bar (enrolled) or start button (not enrolled) */}
                <div className="mt-6">
                  {enrolled && progress ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          {progress.completedLessons} / {totalLessons} {t('courses.lessonsCompleted')}
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
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400"
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {progressPercent < 100 && (
                          <Link
                            href={`/courses/${slug}/lessons/${findNextLesson(sortedModules, completedSet)}`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-8 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all"
                          >
                            <Play className="h-4 w-4" />
                            {t('courses.continue')}
                          </Link>
                        )}
                        {progressPercent === 100 && (
                          <Link
                            href={`/certificates/request/${course.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-8 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all"
                          >
                            <Award className="h-4 w-4" />
                            {t('certificates.getCertificate')}
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span className="text-sm">Для доступа оплатите курс через бота</span>
                      </div>
                      <a
                        href="https://t.me/aibot_learn_bot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-8 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all"
                      >
                        Купить в Telegram-боте
                      </a>
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
                          : 'bg-orange-500/10'
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
                      const locked = !enrolled;

                      return (
                        <motion.div key={lesson.id} variants={staggerItem}>
                          {locked ? (
                            <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card/30 px-5 py-4 opacity-60">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground truncate">{lesson.title}</p>
                                <span className="text-xs text-muted-foreground capitalize">
                                  {lesson.type === 'VIDEO' ? t('courses.video') : lesson.type === 'TEXT' ? t('courses.text') : lesson.type.toLowerCase()}
                                </span>
                              </div>
                            </div>
                          ) : (
                          <Link
                            href={`/courses/${slug}/lessons/${lesson.id}`}
                            className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm px-5 py-4 hover:border-orange-500/30 hover:bg-card/80 transition-all"
                          >
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                isDone
                                  ? 'bg-green-500/15 text-green-500'
                                  : 'bg-secondary/50 text-muted-foreground group-hover:bg-orange-500/10 group-hover:text-primary'
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {lesson.title}
                              </p>
                              <span className="text-xs text-muted-foreground capitalize">
                                {lesson.type === 'VIDEO' ? t('courses.video') : lesson.type === 'TEXT' ? t('courses.text') : lesson.type.toLowerCase()}
                              </span>
                            </div>
                            {lesson.duration != null && lesson.duration > 0 && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{lesson.duration} {t('common.min')}</span>
                              </div>
                            )}
                          </Link>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
    </div>
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
