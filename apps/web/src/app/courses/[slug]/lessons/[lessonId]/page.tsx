'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';
import { VideoPlayer } from '@/components/lms/VideoPlayer';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

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
  tasks: Task[];
  progress: {
    completed: boolean;
    watchedSec: number;
    completedAt: string | null;
  } | null;
}

export default function LessonPage() {
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;
  const token = useAuthStore(s => s.token);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest<LessonDetail>(
          `/api/courses/${slug}/lessons/${lessonId}`, {}, token,
        );
        setLesson(data);
      } catch (err) {
        console.error('Failed to load lesson:', err);
      } finally {
        setLoading(false);
      }
    }

    if (token) load();
  }, [slug, lessonId, token]);

  const handleTimeUpdate = useCallback(async (currentTime: number) => {
    try {
      await apiRequest(`/api/progress/lesson/${lessonId}/watchtime`, {
        method: 'PATCH',
        body: JSON.stringify({ watchedSec: currentTime }),
      }, token);
    } catch {
      // Silently fail watchtime updates
    }
  }, [lessonId, token]);

  const handleComplete = useCallback(async () => {
    setCompleting(true);
    try {
      await apiRequest(`/api/progress/lesson/${lessonId}/complete`, {
        method: 'POST',
      }, token);
      setLesson(prev => prev ? {
        ...prev,
        progress: {
          completed: true,
          watchedSec: prev.progress?.watchedSec ?? 0,
          completedAt: new Date().toISOString(),
        },
      } : null);
    } catch (err) {
      console.error('Failed to complete:', err);
    } finally {
      setCompleting(false);
    }
  }, [lessonId, token]);

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

  if (!lesson) {
    return (
      <AuthGuard>
        <Sidebar />
        <div className="ml-64">
          <TopBar />
          <div className="text-center py-20 text-zinc-400">Урок не найден</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Sidebar />
      <div className="ml-64">
        <TopBar />
        <main className="p-6 max-w-4xl">
          <Link
            href={`/courses/${slug}`}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            &larr; Назад к курсу
          </Link>

          <h1 className="mt-4 mb-6 text-2xl font-bold text-white">{lesson.title}</h1>

          {/* Video */}
          {lesson.type === 'VIDEO' && lesson.videoUrl && (
            <div className="mb-6">
              <VideoPlayer
                src={lesson.videoUrl}
                initialTime={lesson.progress?.watchedSec ?? 0}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>
          )}

          {/* Content */}
          {lesson.content && (
            <div
              className="prose prose-invert prose-sm max-w-none mb-6"
              dangerouslySetInnerHTML={{ __html: lesson.content }}
            />
          )}

          {/* Description */}
          {lesson.description && (
            <p className="text-zinc-400 mb-6">{lesson.description}</p>
          )}

          {/* Tasks */}
          {lesson.tasks.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">Задания</h2>
              <div className="space-y-3">
                {lesson.tasks.map(task => (
                  <div key={task.id} className="rounded-xl border border-dark-border bg-dark-card p-5">
                    <h3 className="font-medium text-white">{task.title}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{task.description}</p>
                    <span className="mt-2 inline-block text-xs text-zinc-500">
                      Макс. баллов: {task.maxScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete button */}
          <button
            onClick={handleComplete}
            disabled={lesson.progress?.completed || completing}
            className={`w-full rounded-xl py-3 text-sm font-medium transition-colors ${
              lesson.progress?.completed
                ? 'bg-green-500/20 text-green-400 cursor-default'
                : 'bg-brand text-white hover:bg-brand-hover disabled:opacity-50'
            }`}
          >
            {lesson.progress?.completed ? 'Урок выполнен' : completing ? 'Сохранение...' : 'Отметить как выполненный'}
          </button>
        </main>
      </div>
    </AuthGuard>
  );
}
