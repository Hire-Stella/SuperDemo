import Navbar from './components/sections/Navbar';
import Footer from './components/sections/Footer';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Highlights from './components/sections/Highlights';
import Services from './components/sections/Services';
import Steps from './components/sections/Steps';
import Gallery from './components/sections/Gallery';
import Stats from './components/sections/Stats';
import Testimonials from './components/sections/Testimonials';
import Faq from './components/sections/Faq';
import Contact from './components/sections/Contact';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <Highlights />
        <Services />
        <Steps />
        <Gallery />
        <Stats />
        <Testimonials />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
