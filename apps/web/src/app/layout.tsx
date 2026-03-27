import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ToastContainer } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'AiBot — Образовательная платформа с ИИ',
  description: 'Онлайн-курсы с AI-помощником, видеоуроками и сертификатами. Начните обучение уже сегодня.',
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <Providers>
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
