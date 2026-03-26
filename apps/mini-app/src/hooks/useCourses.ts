import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';

interface LessonSummary {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  order: number;
  isFree: boolean;
}

interface ModuleDetail {
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
  modules: ModuleDetail[];
}

interface LessonDetail {
  id: string;
  title: string;
  type: string;
  videoUrl: string | null;
  content: string | null;
  description: string | null;
  duration: number | null;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    maxScore: number;
  }>;
  progress: {
    completed: boolean;
    watchedSec: number;
    completedAt: string | null;
  } | null;
}

interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

export function useCourseDetail(slug: string) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<CourseDetail>(`/api/courses/${slug}`)
      .then(setCourse)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return { course, loading, error };
}

export function useLessonDetail(slug: string, lessonId: string) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<LessonDetail>(`/api/courses/${slug}/lessons/${lessonId}`)
      .then(setLesson)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug, lessonId]);

  const completeLesson = useCallback(async () => {
    await apiRequest(`/api/progress/lesson/${lessonId}/complete`, { method: 'POST' });
    setLesson(prev => prev ? { ...prev, progress: { completed: true, watchedSec: prev.progress?.watchedSec ?? 0, completedAt: new Date().toISOString() } } : null);
  }, [lessonId]);

  const updateWatchtime = useCallback(async (watchedSec: number) => {
    await apiRequest(`/api/progress/lesson/${lessonId}/watchtime`, {
      method: 'PATCH',
      body: JSON.stringify({ watchedSec }),
    });
  }, [lessonId]);

  return { lesson, loading, error, completeLesson, updateWatchtime };
}

export function useCourseProgress(courseId: string) {
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    apiRequest<CourseProgress>(`/api/progress/course/${courseId}`)
      .then(setProgress)
      .catch(() => setProgress(null))
      .finally(() => setLoading(false));
  }, [courseId]);

  return { progress, loading };
}
