import { AboutSection } from "./components/AboutSection";
import { FaqSection } from "./components/FaqSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { HeroSection } from "./components/HeroSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { IntegrationSection } from "./components/IntegrationSection";
import { PerformanceSection } from "./components/PerformanceSection";
import { PricingSection } from "./components/PricingSection";
import { TestimonialsSection } from "./components/TestimonialsSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <IntegrationSection />
      <PerformanceSection />
      <AboutSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
    </>
  );
}
