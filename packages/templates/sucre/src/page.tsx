import Navbar from './components/sections/Navbar';
import Footer from './components/sections/Footer';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Stats from './components/sections/Stats';
import Services from './components/sections/Services';
import Highlights from './components/sections/Highlights';
import Pricing from './components/sections/Pricing';
import Testimonials from './components/sections/Testimonials';
import Gallery from './components/sections/Gallery';
import Faq from './components/sections/Faq';
import Contact from './components/sections/Contact';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <Stats />
        <Services />
        <Highlights />
        <Pricing />
        <Testimonials />
        <Gallery />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
