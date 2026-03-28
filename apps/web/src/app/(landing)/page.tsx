import dynamic from 'next/dynamic';
import { HeroSection } from '@/components/landing/HeroSection';

import type { Metadata } from 'next';

// Lazy-load below-the-fold sections to reduce initial JS bundle
const AboutSection = dynamic(
  () => import('@/components/landing/AboutSection').then((m) => ({ default: m.AboutSection })),
  { ssr: true },
);
const CoursesSection = dynamic(
  () => import('@/components/landing/CoursesSection').then((m) => ({ default: m.CoursesSection })),
  { ssr: true },
);
const HowItWorksSection = dynamic(
  () => import('@/components/landing/HowItWorksSection').then((m) => ({ default: m.HowItWorksSection })),
  { ssr: true },
);
const ReviewsSection = dynamic(
  () => import('@/components/landing/ReviewsSection').then((m) => ({ default: m.ReviewsSection })),
  { ssr: true },
);
const FAQSection = dynamic(
  () => import('@/components/landing/FAQSection').then((m) => ({ default: m.FAQSection })),
  { ssr: true },
);
const CTASection = dynamic(
  () => import('@/components/landing/CTASection').then((m) => ({ default: m.CTASection })),
  { ssr: true },
);

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
      <HeroSection />
      <AboutSection />
      <CoursesSection />
      <HowItWorksSection />
      <ReviewsSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
