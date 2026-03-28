'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';
import {
  Play,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Target,
  Zap,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const VideoPlayer = dynamic(
  () => import('@/components/lms/VideoPlayer').then((m) => ({ default: m.VideoPlayer })),
  {
    loading: () => <div className="skeleton h-48 rounded-2xl" />,
    ssr: false,
  },
);
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';

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
  const { t } = useI18n();

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [notEnrolled, setNotEnrolled] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [savedPosition, setSavedPosition] = useState(0);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

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
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('оплатите') || msg.includes('NOT_ENROLLED') || msg.includes('нет доступа')) {
          setNotEnrolled(true);
        }
      } finally {
        setLoading(false);
      }
    }

    if (token) load();
  }, [slug, lessonId, token]);

  // Check for saved position in localStorage on mount
  useEffect(() => {
    try {
      const savedStr = localStorage.getItem(`video-pos-${lessonId}`);
      const savedSec = savedStr ? parseFloat(savedStr) : 0;
      const serverSec = lesson?.progress?.watchedSec ?? 0;
      const resumeFrom = Math.max(savedSec, serverSec);
      if (resumeFrom > 10) {
        setSavedPosition(resumeFrom);
        setShowResumeBanner(true);
        // Auto-dismiss after 8 seconds
        const timer = setTimeout(() => setShowResumeBanner(false), 8000);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable
    }
  }, [lessonId, lesson?.progress?.watchedSec]);

  /* watchtime reporting (debounced — waits 2s after last call) */
  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
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
      }, 2000);
    },
    [lessonId, token],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

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
    return <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (notEnrolled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="p-6 rounded-3xl bg-orange-500/10 border border-orange-500/20 mb-6">
          <svg className="w-16 h-16 text-orange-500 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">Доступ закрыт</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Для доступа к урокам курса оплатите его через нашего Telegram-бота
        </p>
        <a
          href="https://t.me/aibot_learn_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-8 py-3 text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all"
        >
          Купить в Telegram-боте
        </a>
        <Link href={`/courses/${slug}`} className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Вернуться к курсу
        </Link>
      </div>
    );
  }

  if (!lesson) {
    return <div className="text-center py-20 text-muted-foreground">{t('lesson.notFound')}</div>;
  }

  const isCompleted = lesson.progress?.completed || completedLessons.has(lessonId);
  const lessonNumber = currentIndex + 1;
  const totalLessons = allLessons.length;
  const taskCount = lesson.tasks.length;

  /* ---------- render ---------- */

  return (
    <>
      {/* Back link */}
          <Link
            href={`/courses/${slug}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('lesson.backToCourse')}
          </Link>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* ====== LEFT COLUMN ====== */}
            <div className="flex-1 min-w-0 lg:flex-[7]">
              {/* Resume banner */}
              <AnimatePresence>
                {showResumeBanner && savedPosition > 10 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-3 flex items-center justify-between bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Play className="h-4 w-4 text-primary" />
                      <span className="text-foreground">
                        {t('lesson.continueFrom')} {formatDuration(Math.floor(savedPosition))}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowResumeBanner(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Video area */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="rounded-3xl overflow-hidden bg-card"
              >
                {lesson.videoUrl ? (
                  <VideoPlayer
                    src={lesson.videoUrl}
                    lessonId={lessonId}
                    initialTime={lesson.progress?.watchedSec ?? 0}
                    onTimeUpdate={handleTimeUpdate}
                    onComplete={handleComplete}
                  />
                ) : (
                  <div className="w-full aspect-video flex flex-col items-center justify-center bg-secondary text-muted-foreground">
                    <Play className="h-16 w-16 mb-3 opacity-30" />
                    <span className="text-sm opacity-50">
                      {t('lesson.videoUnavailable')}
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
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-primary">
                    {t('lesson.lesson')} {lessonNumber}
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
                  className="mt-4 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.content) }}
                />
              )}

              {/* Info cards row */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
              >
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('lesson.difficulty')}</p>
                    <p className="text-sm font-medium text-foreground">
                      {t('lesson.medium')}
                    </p>
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                    <BookOpen className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('lesson.tasks')}</p>
                    <p className="text-sm font-medium text-foreground">
                      {taskCount} {t('lesson.practice')}
                    </p>
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10">
                    <Zap className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('lesson.reward')}</p>
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
                      : 'bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 text-white hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50'
                  }`}
                >
                  {isCompleted
                    ? t('lesson.completed')
                    : completing
                      ? t('common.saving')
                      : t('lesson.completeAndTest')}
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
                    {t('lesson.prev')}
                  </button>
                ) : (
                  <span />
                )}

                <span className="text-xs text-muted-foreground">
                  {t('lesson.lesson')} {lessonNumber} {t('lesson.of')} {totalLessons}
                </span>

                {nextLesson ? (
                  <button
                    onClick={() => goToLesson(nextLesson.id)}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t('lesson.next')}
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
              className="shrink-0 w-full lg:flex-[3]"
            >
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-5 sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">
                    {t('lesson.content')}
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
                            ? 'border border-primary bg-orange-500/10'
                            : 'border border-transparent hover:bg-card/80'
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                            isDone
                              ? 'bg-green-500/20 text-green-500'
                              : isActive
                                ? 'bg-orange-500/20 text-primary'
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
    </>
  );
}
