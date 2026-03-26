'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  // Detect locale from localStorage (safe for client component)
  const locale =
    typeof window !== 'undefined'
      ? (localStorage.getItem('lms-locale') || 'ru')
      : 'ru';

  const messages = {
    ru: {
      title: 'Что-то пошло не так',
      description: 'Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернитесь на главную.',
      retry: 'Попробовать снова',
      dashboard: 'На дашборд',
    },
    kz: {
      title: 'Бірдеңе дұрыс болмады',
      description: 'Күтпеген қате орын алды. Бетті жаңартып көріңіз немесе басты бетке оралыңыз.',
      retry: 'Қайтадан байқап көру',
      dashboard: 'Басқару тақтасына',
    },
  };

  const t = messages[locale as keyof typeof messages] ?? messages.ru;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-3xl border border-border/50 p-8 text-center space-y-6 shadow-2xl">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        {/* Text */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{t.description}</p>
          {error.digest && (
            <p className="text-[10px] text-muted-foreground/50 mt-2 font-mono">
              ID: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary via-accent to-orange-400 text-white font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            {t.retry}
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-border text-foreground font-medium hover:bg-secondary/50 transition-colors min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            {t.dashboard}
          </Link>
        </div>
      </div>
    </div>
  );
}
