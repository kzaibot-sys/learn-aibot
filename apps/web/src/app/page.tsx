import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProgramSection } from '@/components/landing/ProgramSection';
import { AudienceSection } from '@/components/landing/AudienceSection';
import { ResultsSection } from '@/components/landing/ResultsSection';
import { ReviewsSection } from '@/components/landing/ReviewsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ProgramSection />
        <AudienceSection />
        <ResultsSection />
        <ReviewsSection />
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
