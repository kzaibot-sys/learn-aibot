'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, Download, Loader2, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/context';

interface Progress {
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

interface Certificate {
  id: string;
  number: string;
  fileUrl: string | null;
  issuedAt: string;
}

export default function CertificateRequestPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const token = useAuthStore(s => s.token);
  const { t } = useI18n();

  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');

  const hasName = Boolean(user?.firstName && user?.lastName);

  useEffect(() => {
    apiRequest<Progress>(`/api/progress/course/${courseId}`, {}, token)
      .then(setProgress)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, token]);

  // Pre-fill from user profile if available
  useEffect(() => {
    if (user?.firstName) setFirstName(user.firstName);
    if (user?.lastName) setLastName(user.lastName);
  }, [user]);

  const handleRequest = async () => {
    setRequesting(true);
    setError('');
    try {
      const cert = await apiRequest<Certificate>(`/api/certificates/request/${courseId}`, {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName }),
      }, token);
      setCertificate(cert);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setRequesting(false);
    }
  };

  const handleDownload = () => {
    if (certificate) {
      window.open(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/certificates/${certificate.id}/download?token=${encodeURIComponent(token || '')}`,
        '_blank',
      );
    }
  };

  return (
    <div className="flex items-center justify-center p-4 min-h-[60vh] animate-fade-in-up">
      <div className="w-full max-w-md">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : certificate ? (
          /* Success state */
          <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 text-center space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl bg-gradient-to-r from-emerald-500 to-green-400" />
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t('certificates.ready')}</h1>
            <p className="text-sm text-muted-foreground font-mono">{t('certificates.numberLabel')}: {certificate.number}</p>
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 text-white font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all"
            >
              <Download className="w-4 h-4" />
              {t('certificates.download')}
            </button>
            <button
              onClick={() => router.push('/certificates')}
              className="block w-full text-sm text-primary hover:underline"
            >
              {t('certificates.allCertificates')}
            </button>
          </div>
        ) : progress && progress.progressPercent >= 100 ? (
          /* Request form */
          <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400" />
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground">{t('certificates.getCertificate')}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t('certificates.courseComplete')}</p>
            </div>

            {/* Name warning if not set in profile */}
            {!hasName && (
              <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">{t('certificates.fillNameWarning')}</p>
                  <Link href="/profile" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                    {t('certificates.goToProfile')}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">{t('certificates.firstName')}</label>
                <input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder={t('certificates.namePlaceholder')}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">{t('certificates.lastName')}</label>
                <input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder={t('certificates.namePlaceholder')}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleRequest}
              disabled={requesting || !firstName.trim() || !lastName.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 text-white font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
              {t('certificates.getCertificate')}
            </button>
          </div>
        ) : (
          /* Course not complete */
          <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl bg-gradient-to-r from-orange-500/50 to-amber-400/50" />
            <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <Award className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t('certificates.courseNotComplete')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('certificates.completeForCert')}{' '}
              {t('certificates.progressLabel')}: {progress?.completedLessons || 0}/{progress?.totalLessons || 0} {t('certificates.lessonsOf')}
            </p>
            {progress && (
              <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
            )}
            <Link
              href="/certificates"
              className="inline-block text-sm text-primary hover:underline"
            >
              {t('certificates.allCertificates')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
