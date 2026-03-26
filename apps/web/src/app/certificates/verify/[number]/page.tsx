'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Award } from 'lucide-react';

interface VerifyResult {
  number: string;
  fullName: string;
  courseTitle: string;
  issuedAt: string;
}

export default function CertificateVerifyPage() {
  const { number } = useParams<{ number: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  // Detect locale from localStorage for public page (no AuthGuard / I18nProvider guarantee)
  const locale =
    typeof window !== 'undefined'
      ? localStorage.getItem('lms-locale') || 'ru'
      : 'ru';

  const messages = {
    ru: {
      verified: 'Сертификат подтверждён',
      owner: 'Владелец',
      course: 'Курс',
      issueDate: 'Дата выдачи',
      numberLabel: 'Номер',
      issuedBy: 'Выдан платформой AiBot',
      notFoundTitle: 'Сертификат не найден',
      notFoundDesc: `Сертификат с номером ${number} не найден в системе.`,
    },
    kz: {
      verified: 'Сертификат расталды',
      owner: 'Иесі',
      course: 'Курс',
      issueDate: 'Берілген күні',
      numberLabel: 'Нөмірі',
      issuedBy: 'AiBot платформасы берді',
      notFoundTitle: 'Сертификат табылмады',
      notFoundDesc: `${number} нөмірмен сертификат жүйеде табылмады.`,
    },
  };

  const t = messages[locale as keyof typeof messages] ?? messages.ru;

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/certificates/verify/${number}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setResult(data.data);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [number]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : result ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t.verified}</h1>

            <div className="space-y-3 text-left bg-secondary/50 rounded-xl p-4">
              <div>
                <span className="text-xs text-muted-foreground">{t.owner}</span>
                <p className="text-sm font-medium text-foreground">{result.fullName}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t.course}</span>
                <p className="text-sm font-medium text-foreground">{result.courseTitle}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t.issueDate}</span>
                <p className="text-sm font-medium text-foreground">
                  {new Date(result.issuedAt).toLocaleDateString(locale === 'kz' ? 'kk-KZ' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t.numberLabel}</span>
                <p className="text-sm font-mono text-foreground">{result.number}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <Award className="w-3.5 h-3.5" />
              <span>{t.issuedBy}</span>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t.notFoundTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {t.notFoundDesc}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
