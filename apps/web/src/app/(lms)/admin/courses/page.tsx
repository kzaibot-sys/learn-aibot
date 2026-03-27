'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, Users, Eye, EyeOff, Trash2, Layers } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';

interface AdminCourse {
  id: string;
  slug: string;
  title: string;
  price: string;
  currency: string;
  isPublished: boolean;
  isFree: boolean;
  coverUrl?: string | null;
  createdAt: string;
  _count: { enrollments: number };
}

const gradientPlaceholders = [
  'from-orange-500 to-amber-400',
  'from-purple-500 to-violet-400',
  'from-emerald-500 to-green-400',
  'from-blue-500 to-cyan-400',
  'from-rose-500 to-pink-400',
];

export default function AdminCoursesPage() {
  const { t } = useI18n();
  const token = useAuthStore(s => s.token);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      const data = await apiRequest<AdminCourse[]>('/api/admin/courses', {}, token);
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  async function handleDelete(id: string) {
    if (!confirm(t('admin.deleteCourseConfirm'))) return;
    try {
      await apiRequest(`/api/admin/courses/${id}`, { method: 'DELETE' }, token);
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  async function handleTogglePublish(course: AdminCourse) {
    try {
      await apiRequest(`/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: !course.isPublished }),
      }, token);
      setCourses(prev => prev.map(c =>
        c.id === course.id ? { ...c, isPublished: !c.isPublished } : c
      ));
    } catch (err) {
      console.error('Toggle publish failed:', err);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.courses')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {!loading && `${courses.length} ${t('admin.coursesCount').toLowerCase()}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-4 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all"
        >
          {t('admin.createCourse')}
        </button>
      </div>

      {showCreate && (
        <CreateCourseForm
          token={token}
          onCreated={() => { setShowCreate(false); loadCourses(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">{t('admin.noCourses')}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-muted-foreground">
                    <th className="px-6 py-4 font-medium">{t('admin.courseName')}</th>
                    <th className="px-6 py-4 font-medium">{t('admin.slug')}</th>
                    <th className="px-6 py-4 font-medium text-center">{t('admin.students')}</th>
                    <th className="px-6 py-4 font-medium">{t('admin.status')}</th>
                    <th className="px-6 py-4 font-medium">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, idx) => (
                    <tr key={course.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {course.coverUrl ? (
                            <img src={course.coverUrl} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientPlaceholders[idx % gradientPlaceholders.length]} flex items-center justify-center shrink-0`}>
                              <BookOpen className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <Link href={`/admin/courses/${course.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                            {course.title}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs font-mono">{course.slug}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium">
                          <Users className="w-3 h-3" />
                          {course._count.enrollments}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleTogglePublish(course)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                            course.isPublished
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-secondary/50 text-muted-foreground'
                          }`}
                        >
                          {course.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {course.isPublished ? t('common.published') : t('common.draft')}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/courses/${course.id}/modules`}
                            className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                          >
                            <Layers className="w-3 h-3" />
                            {t('admin.modules')}
                          </Link>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="inline-flex items-center gap-1 text-red-500 hover:underline text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {courses.map((course, idx) => (
              <div key={course.id} className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {course.coverUrl ? (
                    <img src={course.coverUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientPlaceholders[idx % gradientPlaceholders.length]} flex items-center justify-center shrink-0`}>
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/courses/${course.id}`} className="font-medium text-foreground hover:text-primary transition-colors block truncate">
                      {course.title}
                    </Link>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">/{course.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium">
                    <Users className="w-3 h-3" />
                    {course._count.enrollments} {t('admin.students').toLowerCase()}
                  </span>
                  <button
                    onClick={() => handleTogglePublish(course)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      course.isPublished
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-secondary/50 text-muted-foreground'
                    }`}
                  >
                    {course.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {course.isPublished ? t('common.published') : t('common.draft')}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                  <Link
                    href={`/admin/courses/${course.id}/modules`}
                    className="inline-flex items-center gap-1 text-primary text-xs min-h-[36px] px-3 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {t('admin.modules')}
                  </Link>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="inline-flex items-center gap-1 text-red-500 text-xs min-h-[36px] px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CreateCourseForm({
  token,
  onCreated,
  onCancel,
}: {
  token: string | null;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiRequest('/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({ title, slug, price: 0 }),
      }, token);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">{t('admin.newCourse')}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">{t('admin.courseName')}</label>
          <input
            required
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9а-яё]+/g, '-').replace(/(^-|-$)/g, ''));
            }}
            className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">{t('admin.slug')}</label>
          <input
            required
            value={slug}
            onChange={e => setSlug(e.target.value)}
            className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 transition-all"
        >
          {saving ? t('common.creating') : t('common.create')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border/50 px-5 py-2.5 text-sm text-muted-foreground hover:bg-secondary/50 transition-colors"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
