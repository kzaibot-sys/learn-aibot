'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Award, Download, Loader2, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { AuthGuard } from '@/components/lms/AuthGuard';
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
  const user = useAuthStore(s => s.user);
  const { t } = useI18n();

  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<Progress>(`/api/progress/course/${courseId}`)
      .then(setProgress)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleRequest = async () => {
    setRequesting(true);
    setError('');
    try {
      const cert = await apiRequest<Certificate>(`/api/certificates/request/${courseId}`, {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName }),
      });
      setCertificate(cert);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setRequesting(false);
    }
  };

  const handleDownload = () => {
    if (certificate) {
      window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/certificates/${certificate.id}/download`, '_blank');
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : certificate ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-xl font-bold text-foreground">{t('certificates.ready')}</h1>
              <p className="text-sm text-muted-foreground">{t('certificates.numberLabel')}: {certificate.number}</p>
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                {t('certificates.download')}
              </button>
              <Link href="/certificates" className="block text-sm text-primary hover:underline">
                {t('certificates.allCertificates')}
              </Link>
            </div>
          ) : progress && progress.progressPercent >= 100 ? (
            <div className="bg-card rounded-2xl border border-border p-8 space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-xl font-bold text-foreground">{t('certificates.getCertificate')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('certificates.courseComplete')}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">{t('certificates.firstName')}</label>
                  <input
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder={t('certificates.namePlaceholder')}
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">{t('certificates.lastName')}</label>
                  <input
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder={t('certificates.namePlaceholder')}
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                onClick={handleRequest}
                disabled={requesting || !firstName.trim() || !lastName.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                {t('certificates.getCertificate')}
              </button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 flex items-center justify-center">
                <Award className="w-8 h-8 text-orange-500" />
              </div>
              <h1 className="text-xl font-bold text-foreground">{t('certificates.courseNotComplete')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('certificates.completeForCert')}{' '}
                {t('certificates.progressLabel')}: {progress?.completedLessons || 0}/{progress?.totalLessons || 0} {t('certificates.lessonsOf')}
              </p>
              {progress && (
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress.progressPercent}%` }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
