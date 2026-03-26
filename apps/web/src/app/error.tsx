'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
      ? localStorage.getItem('lms-locale') || 'ru'
      : 'ru';

  const messages = {
    ru: {
      title: 'Что-то пошло не так',
      description:
        'Произошла непредвиденная ошибка. Попробуйте обновить страницу.',
      retry: 'Попробовать снова',
      home: 'На главную',
    },
    kz: {
      title: 'Бірдеңе дұрыс болмады',
      description: 'Күтпеген қате орын алды. Бетті жаңартып көріңіз.',
      retry: 'Қайтадан байқап көру',
      home: 'Басты бетке',
    },
  };

  const t = messages[locale as keyof typeof messages] ?? messages.ru;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t.retry}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-border text-foreground font-medium hover:bg-secondary/50 transition-colors"
          >
            {t.home}
          </a>
        </div>
      </div>
    </div>
  );
}
