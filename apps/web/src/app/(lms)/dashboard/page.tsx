'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { SkeletonStatCard, SkeletonCourseRow } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';

/* ---------- types ---------- */

interface CourseProgress {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

interface Certificate {
  id: string;
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

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['my-progress'],
    queryFn: () => apiRequest<CourseProgress[]>('/api/courses/my-progress', {}, token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: certs = [], isLoading: certsLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => apiRequest<Certificate[]>('/api/certificates/my', {}, token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const certCount = certs.length;
  const loading = coursesLoading || certsLoading;

  /* derived stats */
  const stats = useMemo(() => {
    const totalCompleted = courses.reduce(
      (sum, c) => sum + c.completedLessons,
      0,
    );
    const totalLessons = courses.reduce(
      (sum, c) => sum + c.totalLessons,
      0,
    );
    // rough estimate: ~5 min per completed lesson -> hours
    const hours = Math.round((totalCompleted * 5) / 60);

    return { totalCompleted, totalLessons, hours };
  }, [courses]);

  const statCards = [
    {
      label: t('dashboard.myCourses'),
      value: courses.length,
      icon: BookOpen,
      trend: t('dashboard.active'),
    },
    {
      label: t('dashboard.lessonsCompleted'),
      value: stats.totalCompleted,
      icon: CheckCircle2,
      trend: `${stats.totalLessons} ${t('dashboard.total')}`,
    },
    {
      label: t('dashboard.hoursLearned'),
      value: stats.hours,
      icon: Clock,
      trend: t('dashboard.totalTime'),
    },
    {
      label: t('dashboard.certificates'),
      value: certCount,
      icon: Award,
      trend: t('dashboard.earned'),
    },
  ];

  return (
    <div className="space-y-8">
          {/* -------- welcome section -------- */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-3"
          >
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {t('dashboard.welcome')}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-3xl font-bold tracking-tight text-foreground"
            >
              {t('dashboard.subtitle')}
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
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <SkeletonStatCard key={i} />
                ))}
              </div>
              <div className="space-y-3 mt-8">
                <SkeletonCourseRow />
                <SkeletonCourseRow />
                <SkeletonCourseRow />
              </div>
            </>
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
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 via-orange-400/15 to-orange-400/10 border border-orange-500/20">
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

                {courses.length === 0 ? (
                  <motion.div
                    variants={fadeUp}
                    custom={1}
                    className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 text-center"
                  >
                    <p className="text-muted-foreground mb-2">
                      У вас пока нет курсов.
                    </p>
                    <p className="text-sm text-muted-foreground mb-5">
                      Выберите и оплатите курс через нашего Telegram-бота.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <a
                        href="https://t.me/aibot_learn_bot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow"
                      >
                        Перейти в бот
                        <ChevronRight className="h-4 w-4" />
                      </a>
                      <Link
                        href="/courses"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Каталог курсов
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {courses.map((course, i) => {
                      const dayNumber = course.completedLessons + 1;
                      const isComplete = course.progressPercent === 100;

                      return (
                        <motion.div key={course.id} variants={fadeUp} custom={i + 1}>
                          <Link
                            href={`/courses/${course.slug}`}
                            className="group rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-5 flex items-center gap-4 hover:border-orange-500/30 transition-colors"
                          >
                            {/* icon */}
                            <div className="shrink-0 p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 via-orange-400/15 to-orange-400/10 border border-orange-500/20">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>

                            {/* info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {course.title}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {isComplete
                                  ? t('dashboard.completedStatus')
                                  : `${t('dashboard.day')} ${dayNumber} ${t('dashboard.of')} ${course.totalLessons}`}
                                {' • '}
                                {isComplete ? t('dashboard.completedStatus') : t('dashboard.inProgress')}
                              </p>

                              {/* progress bar */}
                              <div className="mt-2.5 w-full h-2 rounded-full bg-muted/30 overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400"
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${course.progressPercent}%` }}
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
                              {course.progressPercent}%
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
    </div>
  );
}
