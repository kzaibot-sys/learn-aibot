'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Award, Download, Hash, BookOpen, ArrowRight, UserCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  number: string;
  fileUrl: string | null;
  issuedAt: string;
}

interface CourseProgress {
  id: string;
  slug: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

export default function CertificatesPage() {
  const { t } = useI18n();
  const token = useAuthStore(s => s.token);
  const user = useAuthStore(s => s.user);

  const { data: certificates = [], isLoading: certsLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => apiRequest<Certificate[]>('/api/certificates/my', {}, token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: progressData = [], isLoading: progressLoading } = useQuery({
    queryKey: ['my-progress'],
    queryFn: () => apiRequest<CourseProgress[]>('/api/courses/my-progress', {}, token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const availableCourses = useMemo(() => {
    const certCourseIds = new Set(certificates.map(c => c.courseId));
    return progressData.filter(
      p => p.progressPercent >= 100 && !certCourseIds.has(p.id)
    );
  }, [certificates, progressData]);

  const loading = certsLoading || progressLoading;

  const [sending, setSending] = useState<string | null>(null);
  const isMiniApp = typeof window !== 'undefined' && !!(window as unknown as { Telegram?: { WebApp?: unknown } }).Telegram?.WebApp;

  const handleDownload = async (cert: Certificate) => {
    if (isMiniApp) {
      // In Telegram Mini App — send PDF to user's Telegram chat
      setSending(cert.id);
      try {
        await apiRequest('/api/certificates/' + cert.id + '/send-telegram', { method: 'POST' }, token);
        alert('Сертификат отправлен в Telegram!');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Ошибка отправки');
      } finally {
        setSending(null);
      }
    } else {
      // Regular browser — direct download
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      window.open(
        `${apiUrl}/api/certificates/${cert.id}/download?token=${encodeURIComponent(token || '')}`,
        '_blank',
      );
    }
  };

  const hasName = Boolean(user?.firstName && user?.lastName);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {t('certificates.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('certificates.subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 skeleton rounded-3xl" />
          ))}
        </div>
      ) : (
        <>
          {/* My Certificates Section */}
          {certificates.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                {t('certificates.myCertificates')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map(cert => (
                  <div
                    key={cert.id}
                    className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all hover:border-orange-500/30 relative overflow-hidden"
                  >
                    {/* Gradient accent */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/5 via-orange-400/5 to-orange-400/5 pointer-events-none" />
                    <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400" />

                    <div className="flex items-start gap-4 mb-5 relative">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/25">
                        <Award className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-foreground mb-1">
                          {cert.courseTitle}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {t('certificates.completedStatus')}{' '}
                          {new Date(cert.issuedAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>

                    {/* Certificate number */}
                    <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl bg-background/50 border border-border/30 relative">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground font-mono truncate">
                        {cert.number}
                      </span>
                    </div>

                    {/* Download / Send to Telegram button */}
                    <button
                      onClick={() => handleDownload(cert)}
                      disabled={sending === cert.id}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 text-white text-sm font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all disabled:opacity-60"
                    >
                      <Download className="w-4 h-4" />
                      {sending === cert.id ? 'Отправляется...' : (isMiniApp ? 'Отправить в Telegram' : t('certificates.download'))}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available for Request Section */}
          {availableCourses.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                {t('certificates.availableForRequest')}
              </h2>

              {/* Name warning */}
              {!hasName && (
                <div className="mb-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <UserCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                  <p className="flex-1 text-sm text-foreground">
                    {t('certificates.fillNameWarning')}
                  </p>
                  <Link
                    href="/profile"
                    className="text-xs text-primary hover:underline whitespace-nowrap flex items-center gap-1 font-medium"
                  >
                    {t('certificates.goToProfile')}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableCourses.map(course => (
                  <div
                    key={course.id}
                    className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all hover:border-emerald-500/30 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl bg-gradient-to-r from-emerald-500 to-green-400" />

                    <div className="flex items-start gap-4 mb-4 relative">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-foreground mb-1">
                          {course.title}
                        </h3>
                        <p className="text-xs text-emerald-400">
                          {course.completedLessons}/{course.totalLessons} {t('certificates.lessonsOf')} — 100%
                        </p>
                      </div>
                    </div>

                    {hasName ? (
                      <Link
                        href={`/certificates/request/${course.id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-400 text-white text-sm font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
                      >
                        <Award className="w-4 h-4" />
                        {t('certificates.requestCertificate')}
                      </Link>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary/50 text-muted-foreground text-sm font-medium cursor-not-allowed">
                        <Award className="w-4 h-4" />
                        {t('certificates.requestCertificate')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {certificates.length === 0 && availableCourses.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="p-8 rounded-3xl bg-gradient-to-br from-orange-500/15 via-orange-400/10 to-orange-400/5 border border-orange-500/20 mb-6 shadow-xl shadow-orange-500/10">
                <Award className="w-20 h-20 text-primary mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                {t('certificates.noCertificates')}
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                {t('certificates.emptyDesc')}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
