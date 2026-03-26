'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

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

export default function AdminStudentsPage() {
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
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/students?${params}`,
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
      <h1 className="mb-6 text-2xl font-bold text-white">Студенты</h1>

      {/* Search */}
      <div className="mb-6">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Поиск по email или имени..."
          className="w-full max-w-md rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
        />
      </div>

      {/* Grant access */}
      <div className="rounded-xl border border-dark-border bg-dark-card p-4 mb-6">
        <h2 className="text-sm font-semibold mb-3 text-zinc-400">Ручная выдача доступа</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            value={grantUserId}
            onChange={e => setGrantUserId(e.target.value)}
            placeholder="User ID"
            className="rounded-lg border border-dark-border bg-dark-input px-3 py-1.5 text-sm text-white focus:border-brand focus:outline-none"
          />
          <input
            value={grantCourseId}
            onChange={e => setGrantCourseId(e.target.value)}
            placeholder="Course ID"
            className="rounded-lg border border-dark-border bg-dark-input px-3 py-1.5 text-sm text-white focus:border-brand focus:outline-none"
          />
          <button onClick={handleGrant} className="rounded-lg bg-green-600 px-4 py-1.5 text-sm text-white hover:bg-green-700 transition-colors">
            Выдать доступ
          </button>
          {grantMessage && <span className="text-sm text-green-400 self-center">{grantMessage}</span>}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-left text-zinc-500">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Имя</th>
                  <th className="pb-3 font-medium">Роль</th>
                  <th className="pb-3 font-medium">Курсов</th>
                  <th className="pb-3 font-medium">Регистрация</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="border-b border-dark-border/50">
                    <td className="py-3 text-zinc-500 font-mono text-xs">{s.id.slice(0, 8)}...</td>
                    <td className="py-3 text-white">{s.email || '—'}</td>
                    <td className="py-3 text-zinc-400">{[s.firstName, s.lastName].filter(Boolean).join(' ') || '—'}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-dark-hover text-zinc-400'
                      }`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-400">{s._count.enrollments}</td>
                    <td className="py-3 text-zinc-500 text-xs">{new Date(s.createdAt).toLocaleDateString('ru')}</td>
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
                className="rounded-lg border border-dark-border px-3 py-1 text-sm text-zinc-400 hover:bg-dark-hover disabled:opacity-50 transition-colors"
              >
                Назад
              </button>
              <span className="text-sm text-zinc-500">{page} / {meta.totalPages}</span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="rounded-lg border border-dark-border px-3 py-1 text-sm text-zinc-400 hover:bg-dark-hover disabled:opacity-50 transition-colors"
              >
                Вперёд
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
