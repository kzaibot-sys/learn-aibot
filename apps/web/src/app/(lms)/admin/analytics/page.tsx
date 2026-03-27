'use client';

import { useEffect, useState } from 'react';
import { Users, BookOpen, UserPlus, GraduationCap, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';

interface CourseStats {
  id: string;
  title: string;
  slug: string;
  enrolledCount: number;
  avgProgress: number;
  totalLessons: number;
}

interface AnalyticsData {
  totalStudents: number;
  totalCourses: number;
  recentRegistrations: number;
  courses: CourseStats[];
}

export default function AdminAnalyticsPage() {
  const { t } = useI18n();
  const token = useAuthStore(s => s.token);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiRequest<AnalyticsData>('/api/admin/analytics', {}, token)
      .then(setData)
      .catch((err) => console.error('Failed to load analytics:', err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-3xl" />
          ))}
        </div>
        <div className="h-64 skeleton rounded-3xl" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">{t('admin.loadError')}</p>;
  }

  const activeEnrollments = data.courses.reduce((sum, c) => sum + c.enrolledCount, 0);

  const cards = [
    {
      label: t('admin.studentsCount'),
      value: data.totalStudents,
      icon: Users,
      color: 'from-orange-500 to-amber-400',
      textColor: 'text-orange-400',
    },
    {
      label: t('admin.newRegistrations'),
      value: data.recentRegistrations,
      icon: UserPlus,
      color: 'from-emerald-500 to-green-400',
      textColor: 'text-emerald-400',
    },
    {
      label: t('admin.coursesAnalytics'),
      value: data.totalCourses,
      icon: BookOpen,
      color: 'from-purple-500 to-violet-400',
      textColor: 'text-purple-400',
    },
    {
      label: t('admin.activeEnrollments'),
      value: activeEnrollments,
      icon: GraduationCap,
      color: 'from-blue-500 to-cyan-400',
      textColor: 'text-blue-400',
    },
  ];

  const sortedCourses = [...data.courses].sort((a, b) => b.enrolledCount - a.enrolledCount);

  function getProgressColor(progress: number): string {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-emerald-500';
  }

  function getProgressTextColor(progress: number): string {
    if (progress < 30) return 'text-red-400';
    if (progress < 70) return 'text-yellow-400';
    return 'text-emerald-400';
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">{t('admin.analytics')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.courseStatistics')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 relative overflow-hidden transition-all hover:border-orange-500/30"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl bg-gradient-to-r opacity-60" style={{}} />
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
              <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Course Statistics Table */}
      <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t('admin.courseStatistics')}</h2>
              <p className="text-xs text-muted-foreground">{data.courses.length} {t('admin.coursesAnalytics').toLowerCase()}</p>
            </div>
          </div>
        </div>

        {sortedCourses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">{t('admin.noCourseStats')}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-muted-foreground">
                    <th className="px-6 py-4 font-medium">{t('admin.courseName')}</th>
                    <th className="px-6 py-4 font-medium text-center">{t('admin.enrolledStudents')}</th>
                    <th className="px-6 py-4 font-medium">{t('admin.avgProgress')}</th>
                    <th className="px-6 py-4 font-medium text-center">{t('admin.totalLessons')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCourses.map(course => (
                    <tr key={course.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{course.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">/{course.slug}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium">
                          <Users className="w-3 h-3" />
                          {course.enrolledCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <div className="flex-1 bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressColor(course.avgProgress)}`}
                              style={{ width: `${Math.min(course.avgProgress, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold w-10 text-right ${getProgressTextColor(course.avgProgress)}`}>
                            {course.avgProgress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-muted-foreground">
                        {course.totalLessons}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/30">
              {sortedCourses.map(course => (
                <div key={course.id} className="p-4 space-y-3">
                  <div>
                    <p className="font-medium text-foreground">{course.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">/{course.slug}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 font-medium">
                      <Users className="w-3 h-3" />
                      {course.enrolledCount} {t('admin.enrolledStudents').toLowerCase()}
                    </span>
                    <span className="text-muted-foreground">{course.totalLessons} {t('admin.totalLessons').toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-secondary/50 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(course.avgProgress)}`}
                        style={{ width: `${Math.min(course.avgProgress, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold w-10 text-right ${getProgressTextColor(course.avgProgress)}`}>
                      {course.avgProgress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
