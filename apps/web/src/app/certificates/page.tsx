'use client';

import { useEffect, useState } from 'react';
import { Award, Download, Hash } from 'lucide-react';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';
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

export default function CertificatesPage() {
  const { t } = useI18n();
  const token = useAuthStore(s => s.token);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiRequest<Certificate[]>('/api/certificates/my', {}, token)
      .then(setCertificates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleDownload = (cert: Certificate) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    window.open(
      `${apiUrl}/api/certificates/${cert.id}/download?token=${encodeURIComponent(token || '')}`,
      '_blank',
    );
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 md:ml-72 ml-0">
          <TopBar />
          <main className="p-3 sm:p-6 lg:p-8 space-y-8 animate-fade-in-up">

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
                  <div key={i} className="h-40 skeleton rounded-3xl" />
                ))}
              </div>
            ) : certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map(cert => (
                  <div
                    key={cert.id}
                    className="glass-card hover-lift rounded-3xl border border-border/50 p-6 transition-all hover:border-primary/30 relative overflow-hidden"
                  >
                    {/* Gradient border accent */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-orange-400/5 pointer-events-none" />
                    <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl bg-gradient-to-r from-primary via-accent to-orange-400" />

                    <div className="flex items-start gap-4 mb-5 relative">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-primary via-accent to-orange-400 flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
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

                    {/* Download button */}
                    <button
                      onClick={() => handleDownload(cert)}
                      className="hover-lift w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-primary via-accent to-orange-400 text-white text-sm font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all relative"
                    >
                      <Download className="w-4 h-4" />
                      {t('certificates.download')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/15 via-accent/10 to-orange-400/5 border border-primary/20 mb-6 shadow-xl shadow-primary/10">
                  <Award className="w-20 h-20 text-primary mx-auto" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  {t('certificates.noCertificates')}
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  Завершите курс на 100% для получения сертификата. Ваши достижения будут доступны здесь.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
