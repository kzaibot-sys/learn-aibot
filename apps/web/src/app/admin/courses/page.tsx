'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
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
  createdAt: string;
  _count: { enrollments: number };
}

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('admin.courses')}</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-gradient-to-r from-primary via-accent to-orange-400 px-4 py-2 text-sm font-medium text-white hover:shadow-lg hover:shadow-primary/25 transition-all"
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
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : courses.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">{t('admin.noCourses')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="pb-3 font-medium">{t('admin.courseName')}</th>
                <th className="pb-3 font-medium">{t('admin.slug')}</th>
                <th className="pb-3 font-medium">{t('admin.price')}</th>
                <th className="pb-3 font-medium">{t('admin.students')}</th>
                <th className="pb-3 font-medium">{t('admin.status')}</th>
                <th className="pb-3 font-medium">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id} className="border-b border-border/30">
                  <td className="py-3 text-foreground font-medium">{course.title}</td>
                  <td className="py-3 text-muted-foreground">{course.slug}</td>
                  <td className="py-3 text-muted-foreground">
                    {course.isFree ? t('courses.free') : `${course.price} ${course.currency}`}
                  </td>
                  <td className="py-3 text-muted-foreground">{course._count.enrollments}</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleTogglePublish(course)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        course.isPublished
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-secondary/50 text-muted-foreground'
                      }`}
                    >
                      {course.isPublished ? t('common.published') : t('common.draft')}
                    </button>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/courses/${course.id}/modules`}
                        className="text-primary hover:underline text-xs"
                      >
                        {t('admin.modules')}
                      </Link>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  const [price, setPrice] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiRequest('/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({ title, slug, price: Number(price) }),
      }, token);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">{t('admin.newCourse')}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">{t('admin.courseName')}</label>
          <input
            required
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9а-яё]+/g, '-').replace(/(^-|-$)/g, ''));
            }}
            className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">{t('admin.slug')}</label>
          <input
            required
            value={slug}
            onChange={e => setSlug(e.target.value)}
            className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">{t('admin.priceRub')}</label>
          <input
            type="number"
            required
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-gradient-to-r from-primary via-accent to-orange-400 px-4 py-2 text-sm font-medium text-white hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 transition-all"
        >
          {saving ? t('common.creating') : t('common.create')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary/50 transition-colors"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
