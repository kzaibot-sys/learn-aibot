'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

interface Lesson {
  id: string;
  title: string;
  type: string;
  order: number;
  isPublished: boolean;
}

interface Module {
  id: string;
  title: string;
  order: number;
  isPublished: boolean;
  lessons: Lesson[];
}

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  modules: Module[];
}

export default function AdminModulesPage() {
  const params = useParams();
  const courseId = params.id as string;
  const token = useAuthStore(s => s.token);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingToModule, setAddingToModule] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  const loadCourse = useCallback(async () => {
    try {
      // Use admin endpoint via slug-based lookup or direct
      const courses = await apiRequest<CourseDetail[]>('/api/admin/courses', {}, token);
      const found = courses.find((c: CourseDetail) => c.id === courseId);
      if (found) {
        // Load full course with modules
        const full = await apiRequest<CourseDetail>(`/api/courses/${found.slug}`, {}, token);
        setCourse({ ...full, id: found.id });
      }
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId, token]);

  useEffect(() => { loadCourse(); }, [loadCourse]);

  async function handleAddModule() {
    if (!newModuleTitle.trim()) return;
    try {
      await apiRequest(`/api/admin/courses/${courseId}/modules`, {
        method: 'POST',
        body: JSON.stringify({ title: newModuleTitle, order: (course?.modules.length ?? 0) }),
      }, token);
      setNewModuleTitle('');
      loadCourse();
    } catch (err) {
      console.error('Add module failed:', err);
    }
  }

  async function handleAddLesson(moduleId: string) {
    if (!newLessonTitle.trim()) return;
    try {
      await apiRequest(`/api/admin/modules/${moduleId}/lessons`, {
        method: 'POST',
        body: JSON.stringify({ title: newLessonTitle }),
      }, token);
      setNewLessonTitle('');
      setAddingToModule(null);
      loadCourse();
    } catch (err) {
      console.error('Add lesson failed:', err);
    }
  }

  async function handleDeleteModule(moduleId: string) {
    if (!confirm('Удалить модуль и все его уроки?')) return;
    try {
      await apiRequest(`/api/admin/modules/${moduleId}`, { method: 'DELETE' }, token);
      loadCourse();
    } catch (err) {
      console.error('Delete module failed:', err);
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!confirm('Удалить урок?')) return;
    try {
      await apiRequest(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' }, token);
      loadCourse();
    } catch (err) {
      console.error('Delete lesson failed:', err);
    }
  }

  async function handleTogglePublish(type: 'module' | 'lesson', id: string, current: boolean) {
    const endpoint = type === 'module' ? `/api/admin/modules/${id}` : `/api/admin/lessons/${id}`;
    try {
      await apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: !current }),
      }, token);
      loadCourse();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!course) {
    return <p className="text-zinc-400">Курс не найден</p>;
  }

  return (
    <div>
      <Link href="/admin/courses" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        &larr; К списку курсов
      </Link>

      <h1 className="mt-4 mb-6 text-2xl font-bold text-white">{course.title} — Модули и уроки</h1>

      {/* Add module */}
      <div className="flex gap-2 mb-6">
        <input
          value={newModuleTitle}
          onChange={e => setNewModuleTitle(e.target.value)}
          placeholder="Название нового модуля"
          className="flex-1 rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
          onKeyDown={e => e.key === 'Enter' && handleAddModule()}
        />
        <button
          onClick={handleAddModule}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
        >
          Добавить модуль
        </button>
      </div>

      {/* Modules list */}
      <div className="space-y-4">
        {course.modules.map(mod => (
          <div key={mod.id} className="rounded-xl border border-dark-border bg-dark-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">{mod.title}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTogglePublish('module', mod.id, mod.isPublished)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    mod.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-dark-hover text-zinc-400'
                  }`}
                >
                  {mod.isPublished ? 'Опубликован' : 'Черновик'}
                </button>
                <button onClick={() => handleDeleteModule(mod.id)} className="text-red-500 text-xs hover:underline">
                  Удалить
                </button>
              </div>
            </div>

            {/* Lessons */}
            <div className="space-y-2 mb-3">
              {mod.lessons.map(lesson => (
                <div key={lesson.id} className="flex items-center justify-between rounded-lg bg-dark-hover px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{lesson.type}</span>
                    <span className="text-sm text-white">{lesson.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePublish('lesson', lesson.id, lesson.isPublished)}
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        lesson.isPublished ? 'text-green-400' : 'text-zinc-500'
                      }`}
                    >
                      {lesson.isPublished ? 'Опубл.' : 'Черн.'}
                    </button>
                    <button onClick={() => handleDeleteLesson(lesson.id)} className="text-red-500 text-xs hover:underline">
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add lesson */}
            {addingToModule === mod.id ? (
              <div className="flex gap-2">
                <input
                  value={newLessonTitle}
                  onChange={e => setNewLessonTitle(e.target.value)}
                  placeholder="Название урока"
                  className="flex-1 rounded-lg border border-dark-border bg-dark-input px-3 py-1.5 text-sm text-white focus:border-brand focus:outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleAddLesson(mod.id)}
                  autoFocus
                />
                <button onClick={() => handleAddLesson(mod.id)} className="text-brand text-sm hover:underline">
                  Добавить
                </button>
                <button onClick={() => setAddingToModule(null)} className="text-zinc-500 text-sm hover:underline">
                  Отмена
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAddingToModule(mod.id); setNewLessonTitle(''); }}
                className="text-sm text-brand hover:underline"
              >
                + Добавить урок
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
