'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

interface CourseItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  price: string;
  isFree: boolean;
}

interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

interface DashboardCourse extends CourseItem {
  progress: CourseProgress | null;
}

export default function DashboardPage() {
  const token = useAuthStore(s => s.token);
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
                `/api/progress/course/${course.id}`, {}, token,
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

  return (
    <AuthGuard>
      <Sidebar />
      <div className="ml-64">
        <TopBar />
        <main className="p-6">
          <h1 className="mb-6 text-2xl font-bold text-white">Мои курсы</h1>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400 mb-4">У вас пока нет курсов</p>
              <Link href="/" className="text-brand hover:underline">Перейти к каталогу</Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map(course => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group rounded-xl border border-dark-border bg-dark-card overflow-hidden hover:border-brand/50 transition-colors"
                >
                  {course.coverUrl && (
                    <div className="aspect-video bg-dark-hover">
                      <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold text-white group-hover:text-brand transition-colors">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{course.description}</p>
                    )}
                    {course.progress && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-zinc-500 mb-1">
                          <span>{course.progress.completedLessons}/{course.progress.totalLessons} уроков</span>
                          <span>{course.progress.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-dark-hover rounded-full h-1.5">
                          <div
                            className="bg-brand rounded-full h-1.5 transition-all"
                            style={{ width: `${course.progress.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
