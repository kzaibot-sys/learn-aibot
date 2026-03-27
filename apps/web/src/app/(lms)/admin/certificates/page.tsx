'use client';

import { useEffect, useState, useCallback } from 'react';
import { Award, Search, Hash, Calendar, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/context';

interface AdminCertificate {
  id: string;
  number: string;
  studentName: string;
  studentEmail: string | null;
  courseTitle: string;
  courseId: string;
  issuedAt: string;
  fileUrl: string | null;
}

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminCertificatesPage() {
  const { t } = useI18n();
  const token = useAuthStore(s => s.token);
  const [certificates, setCertificates] = useState<AdminCertificate[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: '20' });
      if (search) params.set('search', search);

      const response = await fetch(
        `${API_URL}/api/admin/certificates?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      if (data.success) {
        setCertificates(data.data);
        setMeta(data.meta);
      }
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => { loadCertificates(); }, [loadCertificates]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{t('admin.certificatesTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {meta ? `${meta.total} ${t('admin.totalCertificates').toLowerCase()}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-400/10 border border-orange-500/20">
          <Award className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary">{meta?.total ?? 0}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('admin.searchCertificates')}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-secondary/50 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-2xl" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-500/10 to-amber-400/5 border border-orange-500/20 mb-4">
            <Award className="w-12 h-12 text-primary" />
          </div>
          <p className="text-muted-foreground">{t('admin.noCertificates')}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-muted-foreground">
                    <th className="px-6 py-4 font-medium">{t('admin.studentName')}</th>
                    <th className="px-6 py-4 font-medium">{t('admin.certCourse')}</th>
                    <th className="px-6 py-4 font-medium">{t('admin.certNumber')}</th>
                    <th className="px-6 py-4 font-medium">{t('admin.certDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map(cert => (
                    <tr key={cert.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{cert.studentName}</p>
                        {cert.studentEmail && (
                          <p className="text-xs text-muted-foreground mt-0.5">{cert.studentEmail}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-foreground">
                          <BookOpen className="w-3.5 h-3.5 text-primary" />
                          {cert.courseTitle}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/50 text-xs font-mono text-muted-foreground">
                          <Hash className="w-3 h-3" />
                          {cert.number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(cert.issuedAt).toLocaleDateString('ru-RU')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {certificates.map(cert => (
              <div
                key={cert.id}
                className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 space-y-3 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">{cert.studentName}</p>
                    {cert.studentEmail && (
                      <p className="text-xs text-muted-foreground">{cert.studentEmail}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(cert.issuedAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-foreground truncate">{cert.courseTitle}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/50 w-fit">
                  <Hash className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-mono text-muted-foreground">{cert.number}</span>
                </div>
              </div>
            ))}
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
