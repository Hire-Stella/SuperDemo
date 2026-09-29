import Navbar from './components/sections/Navbar';
import Footer from './components/sections/Footer';
import Hero from './components/sections/Hero';
import Services from './components/sections/Services';
import Pricing from './components/sections/Pricing';
import Highlights from './components/sections/Highlights';
import Testimonials from './components/sections/Testimonials';
import Contact from './components/sections/Contact';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Services />
        <Pricing />
        <Highlights />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
