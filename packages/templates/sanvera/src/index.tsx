import type { SectionKey, TemplateContent, TemplateManifest } from '@stella/template-schema';
import { SanveraProvider } from './context';
import { adapt, SANVERA_DEFAULTS, type SanveraContent } from './content';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import WhyChooseUs from './components/WhyChooseUs';
import Process from './components/Process';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import JourneyCTA from './components/JourneyCTA';
import Footer from './components/Footer';

/**
 * What this template can draw.
 *
 * Declared rather than inferred so a product can offer only the templates that
 * suit a given tenant. Sanvera has no pricing table, no team roster and no
 * before/after — handing it that content would silently drop it, and a picker
 * that knows this can say so before anyone chooses.
 */
export const SANVERA_SUPPORTS = [
  'hero',
  'about',
  'highlights',
  'services',
  'steps',
  'gallery',
  'stats',
  'testimonials',
  'faq',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'sanvera',
  name: 'Sanvera',
  description: 'Warm maroon and cream, oversized wordmark, editorial service list. Suits wellness, clinics and practices.',
  source: 'https://sanvera.framer.website/',
  supports: SANVERA_SUPPORTS,
  preview: '/previews/sanvera.png',
  /**
   * Derived from the source's own `.btn-orange` class (`theme.css`), the
   * literal CTA button used for the hero's "Book a Session"-style link
   * (`components/Hero.tsx`) and every other CTA across the page:
   * `background: var(--orange)` (`#dd6b3a`) with `color: var(--cream)`
   * (`#fdecd4`) — `accent`/`onAccent` are that real fill and label colour,
   * not the maroon body ink. `radius` is that same class's own
   * `border-radius: 999px`. `font`: `.btn-orange` carries no `font-display`
   * class, so it never opts into "Passion One" — it inherits
   * `.sanvera-root`'s own `font-family: var(--font-body), Arial, Helvetica,
   * sans-serif`, and this package defines no `--font-body` value anywhere,
   * so its real, rendered face is that literal fallback chain, Arial.
   * `transition` is `.btn-orange`'s own declared `transition: transform
   * 0.25s ease, background 0.25s ease`.
   */
  widgetTheme: {
    accent: '#dd6b3a',
    onAccent: '#fdecd4',
    radius: '999px',
    font: 'Arial, Helvetica, sans-serif',
    transition: 'transform 0.25s ease, background-color 0.25s ease',
  },
};

/**
 * The page.
 *
 * Section order is the template's own, not the content's. Sanvera's rhythm —
 * dark hero, cream about, dark services — is part of what it is, and letting a
 * caller reorder it would produce a page that is neither this template nor
 * anything anyone designed.
 */
export function SanveraTemplate({ content }: { content: TemplateContent }) {
  return (
    <SanveraTemplateRaw content={adapt(content)} />
  );
}

/** For the gallery and for tests: render the template's own copy verbatim. */
export function SanveraTemplateRaw({
  content = SANVERA_DEFAULTS,
}: {
  content?: SanveraContent;
}) {
  return (
    <SanveraProvider content={content}>
      <div className="sanvera-root flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <About />
          <Services />
          <WhyChooseUs />
          <Process />
          <Testimonials />
          <FAQ />
          <JourneyCTA />
        </main>
        <Footer />
      </div>
    </SanveraProvider>
  );
}

export { SANVERA_DEFAULTS, adapt };
export type { SanveraContent };
