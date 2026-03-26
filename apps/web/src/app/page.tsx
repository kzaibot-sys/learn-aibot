import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { CoursesSection } from '@/components/landing/CoursesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { ReviewsSection } from '@/components/landing/ReviewsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { Footer } from '@/components/landing/Footer';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AiBot — Образовательная платформа с ИИ',
  description: 'Онлайн-курсы с AI-помощником, видеоуроками и сертификатами. Начните обучение уже сегодня.',
  openGraph: {
    title: 'AiBot — Образовательная платформа',
    description: 'Онлайн-курсы с AI-помощником, видеоуроками и сертификатами.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <CoursesSection />
        <HowItWorksSection />
        <ReviewsSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
