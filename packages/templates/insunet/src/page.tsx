import Navbar from './components/sections/Navbar';
import Footer from './components/sections/Footer';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Steps from './components/sections/Steps';
import Services from './components/sections/Services';
import Highlights from './components/sections/Highlights';
import Stats from './components/sections/Stats';
import Testimonials from './components/sections/Testimonials';
import Team from './components/sections/Team';
import Faq from './components/sections/Faq';
import Contact from './components/sections/Contact';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <Steps />
        <Services />
        <Highlights />
        <Stats />
        <Testimonials />
        <Team />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
