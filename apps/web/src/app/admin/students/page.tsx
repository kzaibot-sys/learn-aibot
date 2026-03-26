'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';

interface Student {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
  _count: { enrollments: number };
}

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminStudentsPage() {
  const { t } = useI18n();
  const token = useAuthStore(s => s.token);
  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Grant access form
  const [grantUserId, setGrantUserId] = useState('');
  const [grantCourseId, setGrantCourseId] = useState('');
  const [grantMessage, setGrantMessage] = useState('');

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: '20' });
      if (search) params.set('search', search);

      const response = await fetch(
        `${API_URL}/api/admin/students?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      setStudents(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  async function handleGrant() {
    if (!grantUserId || !grantCourseId) return;
    setGrantMessage('');
    try {
      await apiRequest('/api/admin/enrollments/grant', {
        method: 'POST',
        body: JSON.stringify({ userId: grantUserId, courseId: grantCourseId }),
      }, token);
      setGrantMessage('Доступ выдан');
      setGrantUserId('');
      setGrantCourseId('');
    } catch (err) {
      setGrantMessage(err instanceof Error ? err.message : 'Ошибка');
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t('admin.studentsTitle')}</h1>

      {/* Search */}
      <div className="mb-6">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('admin.searchStudents')}
          className="w-full max-w-md rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {/* Grant access */}
      <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 mb-6">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">{t('admin.grantAccess')}</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            value={grantUserId}
            onChange={e => setGrantUserId(e.target.value)}
            placeholder="User ID"
            className="rounded-lg border border-border/50 bg-secondary/50 px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
          />
          <input
            value={grantCourseId}
            onChange={e => setGrantCourseId(e.target.value)}
            placeholder="Course ID"
            className="rounded-lg border border-border/50 bg-secondary/50 px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
          />
          <button onClick={handleGrant} className="rounded-lg bg-green-600 px-4 py-1.5 text-sm text-white hover:bg-green-700 transition-colors">
            {t('admin.grantAccessButton')}
          </button>
          {grantMessage && <span className="text-sm text-green-400 self-center">{grantMessage}</span>}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="pb-3 font-medium">{t('admin.id')}</th>
                  <th className="pb-3 font-medium">{t('admin.email')}</th>
                  <th className="pb-3 font-medium">{t('admin.name')}</th>
                  <th className="pb-3 font-medium">{t('admin.role')}</th>
                  <th className="pb-3 font-medium">{t('admin.coursesCount')}</th>
                  <th className="pb-3 font-medium">{t('admin.registration')}</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="border-b border-border/30">
                    <td className="py-3 text-muted-foreground font-mono text-xs">{s.id.slice(0, 8)}...</td>
                    <td className="py-3 text-foreground">{s.email || '—'}</td>
                    <td className="py-3 text-muted-foreground">{[s.firstName, s.lastName].filter(Boolean).join(' ') || '—'}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-secondary/50 text-muted-foreground'
                      }`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{s._count.enrollments}</td>
                    <td className="py-3 text-muted-foreground text-xs">{new Date(s.createdAt).toLocaleDateString('ru')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="rounded-lg border border-border/50 px-3 py-1 text-sm text-muted-foreground hover:bg-secondary/50 disabled:opacity-50 transition-colors"
              >
                {t('common.back')}
              </button>
              <span className="text-sm text-muted-foreground">{page} / {meta.totalPages}</span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="rounded-lg border border-border/50 px-3 py-1 text-sm text-muted-foreground hover:bg-secondary/50 disabled:opacity-50 transition-colors"
              >
                {t('common.forward')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
