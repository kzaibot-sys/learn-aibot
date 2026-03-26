'use client';

import { motion } from 'framer-motion';
import { Award, Download, FileText, Hash } from 'lucide-react';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';
import { useI18n } from '@/lib/i18n/context';

/* ---------- mock data ---------- */

interface Certificate {
  id: string;
  courseTitle: string;
  completionDate: string;
  certificateNumber: string;
}

const certificates: Certificate[] = [
  {
    id: '1',
    courseTitle: 'AI и машинное обучение',
    completionDate: '22 марта 2026',
    certificateNumber: 'CERT-2026-0322-AI-ML',
  },
];

/* ---------- animation ---------- */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ---------- component ---------- */

export default function CertificatesPage() {
  const { t } = useI18n();
  const hasCertificates = certificates.length > 0;

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-72">
          <TopBar />
          <main className="p-6 lg:p-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {t('certificates.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('certificates.subtitle')}
              </p>
            </motion.div>

            {hasCertificates ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {certificates.map((cert, i) => (
                  <motion.div
                    key={cert.id}
                    variants={fadeUp}
                    custom={i}
                    className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-6 hover:border-primary/30 transition-colors"
                  >
                    {/* Certificate Header */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-primary via-accent to-orange-400 flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
                        <Award className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-foreground mb-1">
                          {cert.courseTitle}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {t('certificates.completedStatus')} {cert.completionDate}
                        </p>
                      </div>
                    </div>

                    {/* Certificate Details */}
                    <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl bg-background/50 border border-border/30">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-mono">
                        {cert.certificateNumber}
                      </span>
                    </div>

                    {/* Download Button */}
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-primary via-accent to-orange-400 text-white text-sm font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                      <Download className="w-4 h-4" />
                      {t('certificates.download')}
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex flex-col items-center justify-center min-h-[40vh] text-center"
              >
                <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/15 to-orange-400/10 border border-primary/20 mb-6">
                  <Award className="w-16 h-16 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {t('certificates.noCertificates')}
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {t('certificates.emptyDesc')}
                </p>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
