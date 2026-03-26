'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

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
  modules: Module[];
}

interface ProgressLesson {
  lessonId: string;
  completed: boolean;
}

export default function CoursePage() {
  const params = useParams();
  const slug = params.slug as string;
  const token = useAuthStore(s => s.token);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest<CourseDetail>(`/api/courses/${slug}`, {}, token);
        setCourse(data);

        try {
          const progress = await apiRequest<{ lessons: ProgressLesson[] }>(
            `/api/progress/course/${data.id}`, {}, token,
          );
          setCompletedLessons(new Set(progress.lessons.filter(l => l.completed).map(l => l.lessonId)));
        } catch {
          // No progress yet
        }
      } catch (err) {
        console.error('Failed to load course:', err);
      } finally {
        setLoading(false);
      }
    }

    if (token) load();
  }, [slug, token]);

  if (loading) {
    return (
      <AuthGuard>
        <Sidebar />
        <div className="ml-64">
          <TopBar />
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full" />
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!course) {
    return (
      <AuthGuard>
        <Sidebar />
        <div className="ml-64">
          <TopBar />
          <div className="text-center py-20 text-zinc-400">Курс не найден</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Sidebar />
      <div className="ml-64">
        <TopBar />
        <main className="p-6">
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            &larr; Назад к курсам
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-white">{course.title}</h1>
          {course.description && (
            <p className="mt-2 text-zinc-400">{course.description}</p>
          )}

          <div className="mt-8 space-y-6">
            {course.modules.map(mod => (
              <div key={mod.id}>
                <h2 className="text-lg font-semibold text-white mb-3">{mod.title}</h2>
                {mod.description && <p className="text-sm text-zinc-500 mb-3">{mod.description}</p>}
                <div className="space-y-2">
                  {mod.lessons.map(lesson => (
                    <Link
                      key={lesson.id}
                      href={`/courses/${slug}/lessons/${lesson.id}`}
                      className="flex items-center gap-3 rounded-xl border border-dark-border bg-dark-card p-4 hover:border-brand/50 transition-colors"
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                        completedLessons.has(lesson.id)
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-dark-hover text-zinc-500'
                      }`}>
                        {completedLessons.has(lesson.id) ? '&#10003;' : lesson.type === 'VIDEO' ? '&#9654;' : '#'}
                      </span>
                      <div className="flex-1">
                        <span className="text-sm text-white">{lesson.title}</span>
                      </div>
                      {lesson.duration && (
                        <span className="text-xs text-zinc-500">{Math.floor(lesson.duration / 60)} мин</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
