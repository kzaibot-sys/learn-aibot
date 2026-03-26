'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, UserMinus, Search, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/auth';

interface EnrollmentUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  user: EnrollmentUser;
}

interface Student {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

export default function AdminCourseAccessPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const user = useAuthStore(s => s.user);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    try {
      const data = await apiRequest<Enrollment[]>(`/api/admin/courses/${courseId}/enrollments?perPage=100`);
      setEnrollments(data);
    } catch {
      toast('error', 'Не удалось загрузить список');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const searchStudents = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await apiRequest<Student[]>(`/api/admin/students?search=${encodeURIComponent(searchQuery)}&perPage=10`);
      setSearchResults(data);
    } catch {
      toast('error', 'Ошибка поиска');
    } finally {
      setSearching(false);
    }
  };

  const grantAccess = async (userId: string) => {
    try {
      await apiRequest('/api/admin/enrollments/grant', {
        method: 'POST',
        body: JSON.stringify({ userId, courseId }),
      });
      toast('success', 'Доступ выдан');
      fetchEnrollments();
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const revokeAccess = async (userId: string) => {
    if (!confirm('Отозвать доступ?')) return;
    try {
      await apiRequest('/api/admin/enrollments/revoke', {
        method: 'POST',
        body: JSON.stringify({ userId, courseId }),
      });
      toast('success', 'Доступ отозван');
      fetchEnrollments();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка');
    }
  };

  if (user?.role !== 'ADMIN') return null;

  return (
        <div className="mx-auto max-w-4xl py-2">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/admin/courses" className="hover:text-foreground transition-colors">Курсы</Link>
            <span>/</span>
            <Link href={`/admin/courses/${courseId}`} className="hover:text-foreground transition-colors">Редактирование</Link>
            <span>/</span>
            <span className="text-foreground">Доступ</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-6">Управление доступом</h1>

          {/* Search and add */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Добавить студента</h2>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchStudents()}
                  placeholder="Поиск по email или имени..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                onClick={searchStudents}
                disabled={searching}
                className="px-4 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Найти'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map(student => {
                  const enrolled = enrollments.some(e => e.user.id === student.id && e.status === 'ACTIVE');
                  return (
                    <div key={student.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-secondary/50">
                      <div>
                        <span className="text-sm text-foreground">{student.firstName} {student.lastName}</span>
                        <span className="text-xs text-muted-foreground ml-2">{student.email}</span>
                      </div>
                      {enrolled ? (
                        <span className="text-xs text-green-500">Уже есть доступ</span>
                      ) : (
                        <button
                          onClick={() => grantAccess(student.id)}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Выдать
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enrolled students */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Студенты с доступом ({enrollments.filter(e => e.status === 'ACTIVE').length})
            </h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : enrollments.filter(e => e.status === 'ACTIVE').length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Нет студентов с доступом</p>
            ) : (
              <div className="space-y-2">
                {enrollments.filter(e => e.status === 'ACTIVE').map(enrollment => (
                  <div key={enrollment.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-secondary/50">
                    <div>
                      <span className="text-sm text-foreground">
                        {enrollment.user.firstName} {enrollment.user.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">{enrollment.user.email}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        с {new Date(enrollment.enrolledAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <button
                      onClick={() => revokeAccess(enrollment.user.id)}
                      className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
                    >
                      <UserMinus className="w-3.5 h-3.5" /> Отозвать
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
  );
}
