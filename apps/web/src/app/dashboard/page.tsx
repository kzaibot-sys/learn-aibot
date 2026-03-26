'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';

/* ---------- types ---------- */

interface CourseItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  price: string;
  isFree: boolean;
  modulesCount?: number;
}

interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

interface DashboardCourse extends CourseItem {
  progress: CourseProgress | null;
}

/* ---------- animation helpers ---------- */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ---------- component ---------- */

export default function DashboardPage() {
  const { t } = useI18n();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest<CourseItem[]>('/api/courses', {}, token);

        const withProgress = await Promise.all(
          data.map(async (course) => {
            try {
              const progress = await apiRequest<CourseProgress>(
                `/api/progress/course/${course.id}`,
                {},
                token,
              );
              return { ...course, progress };
            } catch {
              return { ...course, progress: null };
            }
          }),
        );

        setCourses(withProgress);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }

    if (token) load();
  }, [token]);

  /* derived stats */
  const stats = useMemo(() => {
    const activeCourses = courses.filter(
      (c) => c.progress && c.progress.progressPercent < 100,
    ).length;
    const completedLessons = courses.reduce(
      (sum, c) => sum + (c.progress?.completedLessons ?? 0),
      0,
    );
    const totalLessons = courses.reduce(
      (sum, c) => sum + (c.progress?.totalLessons ?? 0),
      0,
    );
    // rough estimate: ~5 min per completed lesson -> hours
    const hours = Math.round((completedLessons * 5) / 60);
    const badges = courses.filter(
      (c) => c.progress && c.progress.progressPercent === 100,
    ).length;

    return { activeCourses, completedLessons, totalLessons, hours, badges };
  }, [courses]);

  const statCards = [
    {
      label: t('dashboard.activeCourses'),
      value: stats.activeCourses,
      icon: BookOpen,
      trend: t('dashboard.trendMonth'),
    },
    {
      label: t('dashboard.completed'),
      value: stats.completedLessons,
      icon: CheckCircle2,
      trend: `${stats.totalLessons} ${t('dashboard.ofLessons')}`,
    },
    {
      label: t('dashboard.hours'),
      value: stats.hours,
      icon: Clock,
      trend: t('dashboard.totalTime'),
    },
    {
      label: t('dashboard.achievements'),
      value: stats.badges,
      icon: Award,
      trend: t('dashboard.certificates'),
    },
  ];

  const enrolledCourses = courses.filter((c) => c.progress !== null);

  return (
    <AuthGuard>
      <Sidebar />
      <div className="ml-64">
        <TopBar />
        <main className="p-6 lg:p-8 space-y-8">
          {/* -------- welcome section -------- */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-3"
          >
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {t('dashboard.welcome')}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-3xl font-bold tracking-tight text-foreground"
            >
              AI бот жасау платформасы
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-muted-foreground"
            >
              {t('dashboard.onTrack')}
            </motion.p>
          </motion.div>

          {/* -------- stats cards -------- */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                {statCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.label}
                      variants={fadeUp}
                      custom={i}
                      className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-5 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/15 to-orange-400/10 border border-primary/20">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
                          {card.trend}
                        </span>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground">
                          {card.value}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {card.label}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* -------- progress section -------- */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="space-y-4"
              >
                <motion.div
                  variants={fadeUp}
                  custom={0}
                  className="flex items-center justify-between"
                >
                  <h2 className="text-xl font-semibold text-foreground">
                    {t('dashboard.progress')}
                  </h2>
                  <Link
                    href="/courses"
                    className="text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                  >
                    {t('dashboard.viewAll')}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </motion.div>

                {enrolledCourses.length === 0 ? (
                  <motion.div
                    variants={fadeUp}
                    custom={1}
                    className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 text-center"
                  >
                    <p className="text-muted-foreground mb-4">
                      {t('dashboard.noCourses')}
                    </p>
                    <Link
                      href="/courses"
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary via-accent to-orange-400 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
                    >
                      {t('dashboard.goToCatalog')}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {enrolledCourses.map((course, i) => {
                      const p = course.progress!;
                      const totalModules = course.modulesCount ?? 0;
                      const currentModule = Math.max(
                        1,
                        Math.ceil(
                          (p.completedLessons / Math.max(p.totalLessons, 1)) *
                            (totalModules || 1),
                        ),
                      );
                      const isComplete = p.progressPercent === 100;

                      return (
                        <motion.div key={course.id} variants={fadeUp} custom={i + 1}>
                          <Link
                            href={`/courses/${course.slug}`}
                            className="group rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-5 flex items-center gap-4 hover:border-primary/30 transition-colors"
                          >
                            {/* icon */}
                            <div className="shrink-0 p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/15 to-orange-400/10 border border-primary/20">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>

                            {/* info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {course.title}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {totalModules > 0
                                  ? `${t('dashboard.chapter')} ${currentModule} ${t('dashboard.of')} ${totalModules}`
                                  : `${p.completedLessons} ${t('dashboard.of')} ${p.totalLessons} ${t('dashboard.ofLessons')}`}
                                {' • '}
                                {isComplete ? t('dashboard.completedStatus') : t('dashboard.inProgress')}
                              </p>

                              {/* progress bar */}
                              <div className="mt-2.5 w-full h-2 rounded-full bg-muted/30 overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-orange-400"
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${p.progressPercent}%` }}
                                  viewport={{ once: true }}
                                  transition={{
                                    duration: 0.8,
                                    delay: 0.2 + i * 0.1,
                                    ease: 'easeOut',
                                  }}
                                />
                              </div>
                            </div>

                            {/* percentage */}
                            <span className="shrink-0 text-sm font-semibold text-foreground">
                              {p.progressPercent}%
                            </span>

                            <ChevronRight className="shrink-0 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
