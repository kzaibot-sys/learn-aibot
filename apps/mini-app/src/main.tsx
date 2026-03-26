import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { useTelegramAuth } from './hooks/useTelegramAuth';
import { CoursePage } from './pages/CoursePage';
import { LessonPage } from './pages/LessonPage';
import { ProgressPage } from './pages/ProgressPage';

type View =
  | { page: 'progress' }
  | { page: 'course'; slug: string }
  | { page: 'lesson'; slug: string; lessonId: string };

function App() {
  const { user, loading, error } = useTelegramAuth();
  const [view, setView] = useState<View>({ page: 'progress' });

  // Handle Telegram BackButton
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    if (view.page === 'progress') {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
      const handler = () => {
        if (view.page === 'lesson') {
          setView({ page: 'course', slug: view.slug });
        } else {
          setView({ page: 'progress' });
        }
      };
      tg.BackButton.onClick(handler);
      return () => tg.BackButton.offClick(handler);
    }
  }, [view]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-tg-button border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <div>
          <p className="text-red-500 mb-2">Ошибка авторизации</p>
          <p className="text-tg-hint text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <p className="text-tg-hint">Откройте приложение через Telegram</p>
      </div>
    );
  }

  switch (view.page) {
    case 'progress':
      return (
        <ProgressPage
          onSelectCourse={(slug) => setView({ page: 'course', slug })}
        />
      );

    case 'course':
      return (
        <CoursePage
          slug={view.slug}
          onSelectLesson={(lessonId) => setView({ page: 'lesson', slug: view.slug, lessonId })}
        />
      );

    case 'lesson':
      return (
        <LessonPage
          slug={view.slug}
          lessonId={view.lessonId}
          onBack={() => setView({ page: 'course', slug: view.slug })}
        />
      );
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
