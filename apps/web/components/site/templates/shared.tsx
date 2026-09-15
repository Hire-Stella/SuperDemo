import type { SiteSection } from '@superdemo/contracts';
import { LeadForm } from '@/components/site/lead-form';
import {
  Contact,
  CtaRow,
  Eyebrow,
  Faq,
  Highlights,
  Proof,
  type Site,
  SiteFooter,
  SiteHeader,
  Services,
  Stats,
  ctaHref,
  hero,
  prettyPhone,
  telHref,
} from '@/components/site/parts';
import { Clock, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The pieces every layout is built from.
 *
 * A template's job is arrangement — where the hero sits, how much of the page
 * it covers, which variant of each section suits it. The sections themselves,
 * the lead form, the colour tokens and the section *order* are not a
 * template's business, so they live here and every layout gets the same ones.
 * That is what stops the fifth template drifting into a slightly different
 * idea of what a hero is.
 */

/* ------------------------------ section router ---------------------------- */

interface SectionOptions {
  highlights?: 'cards' | 'plain';
  faqColumns?: 1 | 2;
  /** Undefined suppresses the contact form — the hero already has one. */
  form?: React.ReactNode;
  contactAnchor?: string;
}

function Sections({ site, options = {} }: { site: Site; options?: SectionOptions }) {
  const render = (key: SiteSection) => {
    switch (key) {
      case 'highlights':
        return <Highlights key={key} site={site} variant={options.highlights ?? 'cards'} />;
      case 'services':
        return <Services key={key} site={site} />;
      case 'proof':
        return <Proof key={key} site={site} />;
      case 'faq':
        return <Faq key={key} site={site} columns={options.faqColumns ?? 1} />;
      case 'contact':
        return (
          <Contact key={key} site={site} form={options.form} anchorId={options.contactAnchor} />
        );
      default:
        return null;
    }
  };

  // Deduplicated, because a hand-edited order could repeat a key and a section
  // rendered twice would also duplicate its anchor id.
  const seen = new Set<SiteSection>();
  return (
    <>
      {site.content.sections
        .filter((k) => !seen.has(k) && (seen.add(k), true))
        .map((k) => render(k))}
    </>
  );
}

/** The form, wired to this centre. Built once per template that needs it. */
function form(site: Site, source: 'hero' | 'contact', onHero = false) {
  return (
    <LeadForm
      slug={site.slug}
      source={source}
      onHero={onHero}
      darkSurface={site.style.surface === 'ink' || site.style.surface === 'brand'}
      note={site.content.contact.formNote}
      centreNumber={site.phoneE164}
    />
  );
}

/* ================================= classic ================================ */

/**
 * Centred and generous.
 *
 * The safe, established look — an institute or a law firm, where the job of the
 * page is to make a stranger believe the organisation has been there a while.
 * The header sits above the band rather than inside it, so the hero reads as a
 * panel on a page.
 */

export { Sections, form };
export type { SectionOptions };
