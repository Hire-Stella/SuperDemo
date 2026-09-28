import Navbar from './components/sections/Navbar';
import Footer from './components/sections/Footer';
import Hero from './components/sections/Hero';
import Features from './components/sections/Features';
import Showcase from './components/sections/Showcase';
import Steps from './components/sections/Steps';
import Benefits from './components/sections/Benefits';
import Testimonials from './components/sections/Testimonials';
import Pricing from './components/sections/Pricing';
import Faq from './components/sections/Faq';
import Contact from './components/sections/Contact';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Showcase />
        <Steps />
        <Benefits />
        <Testimonials />
        <Pricing />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
