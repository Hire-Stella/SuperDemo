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
 * The four landing layouts.
 *
 * All in one file deliberately: they share every section and differ only in
 * arrangement, so having them side by side is what stops the fourth one drifting
 * into a slightly different idea of what a hero is. Adding a fifth means adding
 * a case here and an entry to SITE_TEMPLATES in contracts — nothing else.
 *
 * Two things are *not* a template's business, and neither appears below:
 *
 *  * **Colour.** Every hero surface is read from the `--site-hero-*` tokens that
 *    `siteStyleToCss` emits, so the same layout renders on a plain, tinted, dark
 *    or full-brand ground with no branch here. The first version of `bold` had a
 *    near-black baked into it, which meant one of four layouts ignored the
 *    tenant's brand entirely — that is the mistake this indirection exists to
 *    prevent.
 *  * **Section order.** `content.sections` belongs to the tenant, so each layout
 *    maps over it rather than hardcoding a sequence.
 *
 * What a template *does* choose: the hero's composition, how much of the page
 * the hero band covers, and which variant of each section suits it.
 */

export function SiteRender({ site }: { site: Site }) {
  switch (site.template) {
    case 'split':
      return <SplitTemplate site={site} />;
    case 'bold':
      return <BoldTemplate site={site} />;
    case 'directory':
      return <DirectoryTemplate site={site} />;
    case 'classic':
    default:
      return <ClassicTemplate site={site} />;
  }
}

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
function ClassicTemplate({ site }: { site: Site }) {
  const { hero: h } = site.content;

  return (
    <div className="bg-background">
      <SiteHeader site={site} />

      <section className={cn('relative overflow-hidden border-b', hero.band, hero.line)}>
        {/*
          A wash rather than a flat block, so the hero feels lit without the whole
          page committing to a colour. Sized in vmax so it scales with the
          viewport instead of banding on wide screens, and its colour comes from
          the surface tokens — on a full-brand hero it lightens, on a dark one it
          glows.
        */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[42rem]"
          style={{
            background:
              'radial-gradient(60vmax 32vmax at 50% -12vmax, var(--site-hero-wash), transparent 70%)',
          }}
          aria-hidden
        />
        <div
          className={cn(
            'relative mx-auto w-full max-w-4xl px-5 text-center sm:px-8',
            hero.padY,
          )}
        >
          {h.eyebrow && (
            <Eyebrow className={cn('mx-auto justify-center', hero.accent)}>{h.eyebrow}</Eyebrow>
          )}
          <h1
            className={cn(
              'mt-5 text-[clamp(2.4rem,6.2vw,4.2rem)] leading-[1.04] font-semibold text-balance',
              hero.display,
            )}
          >
            {h.headline}
          </h1>
          {h.subhead && (
            <p className={cn('mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed', hero.dim)}>
              {h.subhead}
            </p>
          )}
          <CtaRow content={site.content} phone={site.phoneE164} className="mt-9 justify-center" />
          {site.phoneE164 && (
            <p className={cn('tnum mt-5 text-sm', hero.dim)}>
              or dial{' '}
              <a href={telHref(site.phoneE164)} className={cn('font-medium hover:underline', hero.text)}>
                {prettyPhone(site.phoneE164)}
              </a>
            </p>
          )}
        </div>
      </section>

      <Sections site={site} options={{ form: form(site, 'contact') }} />
      <SiteFooter site={site} />
    </div>
  );
}

/* ================================== split ================================= */

/**
 * The form is the hero.
 *
 * For centres whose page has one job: get a number. Nothing above the fold
 * competes with the form, and the copy beside it exists to justify filling it in
 * rather than to be read first.
 */
function SplitTemplate({ site }: { site: Site }) {
  const { hero: h } = site.content;
  const showForm = site.content.contact.showForm;

  return (
    <div className="bg-background">
      <SiteHeader site={site} />

      <section className={cn('border-b', hero.band, hero.line)}>
        <div
          className={cn(
            'mx-auto grid w-full max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14',
            hero.padY,
          )}
        >
          <div>
            {h.eyebrow && <Eyebrow className={hero.accent}>{h.eyebrow}</Eyebrow>}
            <h1
              className={cn(
                'mt-4 text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.06] font-semibold text-balance',
                hero.display,
              )}
            >
              {h.headline}
            </h1>
            {h.subhead && (
              <p className={cn('mt-5 max-w-xl text-[16px] leading-relaxed', hero.dim)}>{h.subhead}</p>
            )}

            {/* The primary CTA is the form on the right, so this row is the
                escape hatch for someone who would rather just ring. */}
            {site.phoneE164 && (
              <a
                href={telHref(site.phoneE164)}
                className={cn(
                  'mt-7 inline-flex h-12 items-center gap-2.5 rounded-xl px-5 text-[15px] font-semibold transition',
                  hero.buttonGhost,
                  hero.card,
                )}
              >
                <Phone className={cn('size-4', hero.accent)} aria-hidden />
                <span className="tnum">{prettyPhone(site.phoneE164)}</span>
                <span className={hero.dim}>· answered now</span>
              </a>
            )}

            <Stats site={site} onHero className="mt-10 max-w-lg" />
          </div>

          {showForm ? (
            <div
              id="callback"
              className={cn(
                'rounded-3xl border p-6 shadow-lg shadow-black/5 sm:p-7',
                hero.line,
                // A card on a plain or tinted hero wants the page's card colour;
                // on ink or brand it wants the translucent hero card so it reads
                // as part of the band rather than a hole punched in it.
                site.style.surface === 'plain' || site.style.surface === 'tint'
                  ? 'bg-card'
                  : hero.card,
              )}
            >
              <h2 className="text-lg font-semibold tracking-[-0.01em]">
                {h.primaryCta.kind === 'call' ? 'Prefer we call you?' : h.primaryCta.label}
              </h2>
              <p className={cn('mt-1 text-sm', hero.dim)}>
                Two fields. We will ring the number you give us.
              </p>
              <div className="mt-5">{form(site, 'hero', true)}</div>
            </div>
          ) : (
            <div className="flex items-center">
              <CtaRow content={site.content} phone={site.phoneE164} />
            </div>
          )}
        </div>
      </section>

      {/* No form in the contact section: it is already above the fold, and the
          anchor is on the hero card instead. */}
      <Sections site={site} options={{ contactAnchor: 'contact-details' }} />
      <SiteFooter site={site} />
    </div>
  );
}

/* ================================== bold ================================== */

/**
 * Full-bleed hero, oversized type, a stat band, little else.
 *
 * The header lives *inside* the band here, which is what makes it read as one
 * full-bleed statement rather than a coloured section. Pair it with the `ink` or
 * `brand` surface for the loudest version; on `plain` it becomes a stark
 * editorial hero, which is a different and still deliberate look.
 */
function BoldTemplate({ site }: { site: Site }) {
  const { hero: h } = site.content;

  return (
    <div className="bg-background">
      <div className={hero.band}>
        <SiteHeader site={site} onHero />
        <section
          className={cn('mx-auto w-full max-w-6xl px-5 pb-0 sm:px-8', hero.padY, 'pb-0')}
        >
          {h.eyebrow && <Eyebrow className={hero.dim}>{h.eyebrow}</Eyebrow>}
          <h1
            className={cn(
              'mt-6 max-w-4xl text-[clamp(2.6rem,7.4vw,5.2rem)] leading-[0.98] font-semibold text-balance',
              hero.display,
            )}
          >
            {h.headline}
          </h1>
          {h.subhead && (
            <p className={cn('mt-7 max-w-xl text-[17px] leading-relaxed', hero.dim)}>{h.subhead}</p>
          )}
          <CtaRow content={site.content} phone={site.phoneE164} className="mt-9" />

          {site.phoneE164 && (
            <a
              href={telHref(site.phoneE164)}
              className={cn('tnum mt-6 inline-block text-sm transition hover:opacity-100', hero.dim)}
            >
              {prettyPhone(site.phoneE164)}
            </a>
          )}

          <div className={cn('mt-14 border-t py-9', hero.line)}>
            <Stats site={site} onHero />
          </div>
        </section>
      </div>

      <Sections
        site={site}
        options={{ highlights: 'plain', faqColumns: 2, form: form(site, 'contact') }}
      />
      <SiteFooter site={site} />
    </div>
  );
}

/* ================================ directory =============================== */

/**
 * Facts before persuasion.
 *
 * A clinic's visitor already decided to call; they want the number, the hours
 * and whether you are open now. So the hero is short and the fact card sits
 * immediately under it, overlapping, where the eye lands.
 */
function DirectoryTemplate({ site }: { site: Site }) {
  const { hero: h, contact } = site.content;

  const facts = [
    site.phoneE164 && {
      icon: Phone,
      label: 'Call us',
      value: prettyPhone(site.phoneE164),
      href: telHref(site.phoneE164),
    },
    contact.hours && { icon: Clock, label: 'Open', value: contact.hours },
    contact.address && { icon: MapPin, label: 'Find us', value: contact.address },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[];

  return (
    <div className="bg-background">
      <SiteHeader site={site} />

      <section className={cn('border-b pb-20', hero.band, hero.line)}>
        <div className={cn('mx-auto w-full max-w-5xl px-5 pb-0 sm:px-8', hero.padY, 'pb-0')}>
          {h.eyebrow && <Eyebrow className={hero.accent}>{h.eyebrow}</Eyebrow>}
          <h1
            className={cn(
              'mt-4 max-w-3xl text-[clamp(2.1rem,4.8vw,3.3rem)] leading-[1.07] font-semibold text-balance',
              hero.display,
            )}
          >
            {h.headline}
          </h1>
          {h.subhead && (
            <p className={cn('mt-5 max-w-2xl text-[16px] leading-relaxed', hero.dim)}>{h.subhead}</p>
          )}
        </div>
      </section>

      {/* Pulled up into the band above. Negative margin plus relative, rather
          than a grid trick, so it degrades to a normal card if either changes. */}
      <div className="relative z-10 mx-auto -mt-14 w-full max-w-5xl px-5 sm:px-8">
        {/*
          Flex rather than a fixed column count: a centre that has not filled in
          an address has fewer facts, and a four-column grid with three cells
          leaves an empty one showing the divider colour as a grey block. The
          cells divide whatever space there is.
        */}
        <div className="flex flex-col gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-lg shadow-black/5 sm:flex-row sm:flex-wrap">
          {facts.map((f) => (
            <div key={f.label} className="min-w-[13rem] flex-1 bg-card p-5">
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <f.icon className="size-3.5 text-primary" aria-hidden />
                {f.label}
              </span>
              {f.href ? (
                <a
                  href={f.href}
                  className={cn('mt-2 block text-[15px] font-medium hover:underline', 'tnum')}
                >
                  {f.value}
                </a>
              ) : (
                <p className="mt-2 text-[15px] leading-snug">{f.value}</p>
              )}
            </div>
          ))}
          <div className="flex min-w-[13rem] flex-1 items-center bg-card p-5">
            <a
              href={ctaHref(
                h.primaryCta.kind === 'callback' ? h.primaryCta : { ...h.primaryCta, kind: 'callback' },
                site.phoneE164,
              )}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Request a callback
            </a>
          </div>
        </div>
      </div>

      <Sections site={site} options={{ highlights: 'plain', faqColumns: 2, form: form(site, 'contact') }} />
      <SiteFooter site={site} />
    </div>
  );
}
