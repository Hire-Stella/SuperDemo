import Navbar from './components/sections/Navbar';
import Hero from './components/sections/Hero';
import TrustTicker from './components/sections/TrustTicker';
import Comparison from './components/sections/Comparison';
import Highlights from './components/sections/Highlights';
import About from './components/sections/About';
import Steps from './components/sections/Steps';
import Security from './components/sections/Security';
import Stats from './components/sections/Stats';
import Testimonials from './components/sections/Testimonials';
import Pricing from './components/sections/Pricing';
import Faq from './components/sections/Faq';
import Footer from './components/sections/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TrustTicker />
        <Comparison />
        <Highlights />
        <About />
        <Steps />
        <Security />
        <Stats />
        <Testimonials />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
