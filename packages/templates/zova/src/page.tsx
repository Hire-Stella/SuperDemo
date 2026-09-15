import { BlogPreviewSection } from "./components/BlogPreviewSection";
import { ClosingCtaSection } from "./components/ClosingCtaSection";
import { ContactSection } from "./components/ContactSection";
import { FaqSection } from "./components/FaqSection";
import { FeatureCardsSection } from "./components/FeatureCardsSection";
import { HeroSection } from "./components/HeroSection";
import { IntegrationSection } from "./components/IntegrationSection";
import { LogoStrip } from "./components/LogoStrip";
import { PricingSection } from "./components/PricingSection";
import { ProcessSection } from "./components/ProcessSection";
import { TestimonialSection } from "./components/TestimonialSection";
import { WhyChooseSection } from "./components/WhyChooseSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <LogoStrip />
      <FeatureCardsSection />
      <WhyChooseSection />
      <ProcessSection />
      <IntegrationSection />
      <PricingSection />
      <TestimonialSection />
      <FaqSection />
      <BlogPreviewSection />
      <ContactSection />
      <ClosingCtaSection />
    </>
  );
}
