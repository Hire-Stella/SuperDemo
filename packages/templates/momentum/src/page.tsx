import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Hero from "./components/sections/Hero";
import About from "./components/sections/About";
import WhyMomentum from "./components/sections/WhyMomentum";
import Services from "./components/sections/Services";
import HowItWorks from "./components/sections/HowItWorks";
import Results from "./components/sections/Results";
import Pricing from "./components/sections/Pricing";
import Faq from "./components/sections/Faq";
import FinalCta from "./components/sections/FinalCta";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <WhyMomentum />
        <Services />
        <HowItWorks />
        <Results />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
