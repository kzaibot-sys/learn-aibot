'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';

interface StudentEnrollment {
  courseId: string;
  courseTitle: string;
  progressPercent: number;
}

interface Student {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  phone?: string | null;
  createdAt: string;
  _count: { enrollments: number };
  enrollments?: StudentEnrollment[];
}

interface CourseOption {
  id: string;
  title: string;
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
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [studentProgress, setStudentProgress] = useState<Record<string, StudentEnrollment[]>>({});
  const [loadingProgress, setLoadingProgress] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [filterCourseId, setFilterCourseId] = useState('');

  // Grant access form
  const [grantUserId, setGrantUserId] = useState('');
  const [grantCourseId, setGrantCourseId] = useState('');
  const [grantMessage, setGrantMessage] = useState('');

  // Load courses for filter
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/admin/courses?perPage=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setCourses(data.data.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })));
        }
      })
      .catch(() => {});
  }, [token]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: '20' });
      if (search) params.set('search', search);
      if (filterCourseId) params.set('courseId', filterCourseId);

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
  }, [token, page, search, filterCourseId]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  async function handleGrant() {
    if (!grantUserId || !grantCourseId) return;
    setGrantMessage('');
    try {
      await apiRequest('/api/admin/enrollments/grant', {
        method: 'POST',
        body: JSON.stringify({ userId: grantUserId, courseId: grantCourseId }),
      }, token);
      setGrantMessage(t('admin.grantAccessButton') + ' ✓');
      setGrantUserId('');
      setGrantCourseId('');
      loadStudents();
    } catch (err) {
      setGrantMessage(err instanceof Error ? err.message : t('common.error'));
    }
  }

  async function loadStudentProgress(studentId: string) {
    if (studentProgress[studentId]) {
      setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
      return;
    }
    setLoadingProgress(studentId);
    setExpandedStudentId(studentId);
    try {
      // Fetch enrollments for this student from the course enrollments endpoint
      const response = await fetch(
        `${API_URL}/api/admin/students?search=&perPage=1&page=1`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // We'll build progress from available course enrollment data
      const courseProgressData: StudentEnrollment[] = [];
      for (const course of courses) {
        try {
          const enrollRes = await fetch(
            `${API_URL}/api/admin/courses/${course.id}/enrollments?perPage=100`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const enrollData = await enrollRes.json();
          if (enrollData.data) {
            const studentEnrollment = enrollData.data.find(
              (e: { userId: string; progressPercent?: number }) => e.userId === studentId
            );
            if (studentEnrollment) {
              courseProgressData.push({
                courseId: course.id,
                courseTitle: course.title,
                progressPercent: studentEnrollment.progressPercent ?? 0,
              });
            }
          }
        } catch {
          // Skip course if fetch fails
        }
      }
      setStudentProgress(prev => ({ ...prev, [studentId]: courseProgressData }));
    } catch (err) {
      console.error('Failed to load student progress:', err);
    } finally {
      setLoadingProgress(null);
    }
  }

  function getProgressColor(progress: number): string {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-emerald-500';
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">{t('admin.studentsTitle')}</h1>
        <p className="text-sm text-muted-foreground">
          {meta ? `${meta.total} ${t('admin.studentsCount').toLowerCase()}` : ''}
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('admin.searchStudents')}
          className="flex-1 max-w-md rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
        />
        <select
          value={filterCourseId}
          onChange={e => { setFilterCourseId(e.target.value); setPage(1); }}
          className="rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="">{t('admin.allCourses')}</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Grant access */}
      <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">{t('admin.grantAccess')}</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            value={grantUserId}
            onChange={e => setGrantUserId(e.target.value)}
            placeholder="User ID"
            className="rounded-xl border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
          />
          <input
            value={grantCourseId}
            onChange={e => setGrantCourseId(e.target.value)}
            placeholder="Course ID"
            className="rounded-xl border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
          />
          <button
            onClick={handleGrant}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all"
          >
            {t('admin.grantAccessButton')}
          </button>
          {grantMessage && <span className="text-sm text-emerald-400 self-center">{grantMessage}</span>}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-muted-foreground">
                    <th className="px-6 py-4 font-medium">{t('admin.id')}</th>
                    <th className="px-6 py-4 font-medium">{t('admin.email')}</th>
                    <th className="px-6 py-4 font-medium">{t('admin.name')}</th>
                    <th className="px-6 py-4 font-medium">{t('admin.role')}</th>
                    <th className="px-6 py-4 font-medium">{t('admin.coursesCount')}</th>
                    <th className="px-6 py-4 font-medium">{t('admin.courseProgress')}</th>
                    <th className="px-6 py-4 font-medium">{t('admin.registration')}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <>
                      <tr
                        key={s.id}
                        className="border-b border-border/30 hover:bg-secondary/20 transition-colors cursor-pointer"
                        onClick={() => s._count.enrollments > 0 && loadStudentProgress(s.id)}
                      >
                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{s.id.slice(0, 8)}...</td>
                        <td className="px-6 py-4 text-foreground">{s.email || '—'}</td>
                        <td className="px-6 py-4 text-foreground">
                          {[s.firstName, s.lastName].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            s.role === 'ADMIN'
                              ? 'bg-purple-500/20 text-purple-400'
                              : s.role === 'TEACHER'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-secondary/50 text-muted-foreground'
                          }`}>
                            {s.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium">
                            {s._count.enrollments}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {s._count.enrollments > 0 ? (
                            <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                              {t('admin.progress')}
                              {expandedStudentId === s.id ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {new Date(s.createdAt).toLocaleDateString('ru')}
                        </td>
                      </tr>
                      {expandedStudentId === s.id && (
                        <tr key={`${s.id}-progress`} className="border-b border-border/30 bg-secondary/10">
                          <td colSpan={7} className="px-6 py-4">
                            {loadingProgress === s.id ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                {t('common.loading')}
                              </div>
                            ) : studentProgress[s.id]?.length > 0 ? (
                              <div className="space-y-2">
                                {studentProgress[s.id].map(ep => (
                                  <div key={ep.courseId} className="flex items-center gap-3">
                                    <span className="text-xs text-foreground min-w-[150px] truncate">{ep.courseTitle}</span>
                                    <div className="flex-1 max-w-[200px] bg-secondary/50 rounded-full h-2 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${getProgressColor(ep.progressPercent)}`}
                                        style={{ width: `${Math.min(ep.progressPercent, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-muted-foreground w-10 text-right">
                                      {ep.progressPercent}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">{t('admin.noCourseStats')}</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="rounded-xl border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary/50 disabled:opacity-50 transition-colors"
              >
                {t('common.back')}
              </button>
              <span className="text-sm text-muted-foreground">{page} / {meta.totalPages}</span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="rounded-xl border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary/50 disabled:opacity-50 transition-colors"
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
