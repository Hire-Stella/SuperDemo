import Link from 'next/link';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { type PublicSiteDto, type SiteContent, countryForE164 } from '@superdemo/contracts';
import { PLATFORM_NAME } from '@/lib/platform';
import { TenantLogo } from '@/components/tenant-logo';
import { cn } from '@/lib/utils';

/**
 * The pieces every landing template is assembled from.
 *
 * Templates differ in arrangement and emphasis, not in what a services list is,
 * so the sections live here once and each template composes them. That is what
 * keeps "switch template" from being a content migration — and what stops the
 * fourth template quietly rendering FAQ answers differently from the first.
 *
 * All server components. A marketing page's only interactive element is the
 * callback form, and that is the one thing that ships JS.
 */

export type Site = PublicSiteDto;

/* ------------------------------- primitives ------------------------------- */

/** `tel:` needs the bare E.164; humans want it grouped. */
export function telHref(e164: string): string {
  return `tel:${e164.replace(/[^\d+]/g, '')}`;
}

/**
 * Splits the country code off, and leaves the rest alone.
 *
 * Deliberately not grouped further. Correct national grouping is per-country and
 * often per-*range* within a country — a UAE landline is `4 860 8243` while a UAE
 * mobile is `50 123 4567`, both eight or nine digits — so any single pattern is
 * wrong for half the numbers it formats. That is libphonenumber's job, and a
 * confidently mis-grouped number on a client's landing page looks worse than an
 * ungrouped one. The dial code comes from the country table, so that part is
 * always right.
 */
export function prettyPhone(e164: string): string {
  const country = countryForE164(e164);
  if (!country) return e164;
  return `+${country.dial} ${e164.slice(1 + country.dial.length)}`;
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {children}
    </p>
  );
}

/* ------------------------------- hero tokens ------------------------------ */

/**
 * Class sets for anything sitting on the hero band.
 *
 * These read the `--site-hero-*` custom properties that `siteStyleToCss` emits,
 * so a template never branches on which surface it is being rendered on — which
 * is what stopped `bold` from having a hardcoded near-black hero that ignored the
 * tenant's brand. Add a fifth surface in contracts and every template follows
 * with no edit here.
 */
export const hero = {
  band: 'bg-(--site-hero-bg) text-(--site-hero-fg)',
  text: 'text-(--site-hero-fg)',
  dim: 'text-(--site-hero-dim)',
  line: 'border-(--site-hero-line)',
  accent: 'text-(--site-hero-accent)',
  card: 'bg-(--site-hero-card)',
  button:
    'bg-(--site-hero-btn-bg) text-(--site-hero-btn-fg) hover:opacity-90',
  buttonGhost:
    'border border-(--site-hero-line) text-(--site-hero-fg) hover:bg-(--site-hero-card)',
  /** Display type: face and tracking both move with the chosen display axis. */
  display: 'font-display tracking-(--site-display-tracking)',
  /** Vertical rhythm, so density is one token rather than a class per template. */
  padY: 'py-(--site-hero-y)',
  sectionY: 'py-(--site-section-y)',
} as const;

/**
 * A section heading.
 *
 * The `id` is not decoration: `#callback` is what a hero's secondary button
 * targets, and the FAQ and contact anchors are what the header nav uses.
 */
export function SectionHeading({
  title,
  lead,
  align = 'left',
}: {
  title: string;
  lead?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      <h2 className={cn(hero.display, 'text-[clamp(1.6rem,3.2vw,2.4rem)] leading-[1.12] font-semibold')}>
        {title}
      </h2>
      {lead && <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">{lead}</p>}
    </div>
  );
}

/* ---------------------------------- CTAs ---------------------------------- */

/**
 * Resolves a configured CTA into something clickable.
 *
 * A `call` button with no number assigned would be a dead link, so it degrades
 * to the callback form rather than rendering `tel:null` — a centre mid-setup is
 * a normal state, not an error to surface to its visitors.
 */
export function ctaHref(
  cta: SiteContent['hero']['primaryCta'],
  phone: string | null,
): string {
  if (cta.kind === 'call') return phone ? telHref(phone) : '#callback';
  if (cta.kind === 'callback') return '#callback';
  return cta.href?.trim() || '#callback';
}

/**
 * The hero's buttons.
 *
 * Always rendered on the hero band, so they always read the hero tokens — the
 * contrast pairing is decided once in `SURFACE_TOKENS` rather than per template.
 * `rounded-xl` needs no special handling: it derives from `--radius`, which the
 * corners axis sets, so these follow the chosen radius for free.
 */
export function CtaRow({
  content,
  phone,
  className,
}: {
  content: SiteContent;
  phone: string | null;
  className?: string;
}) {
  const { primaryCta, secondaryCta } = content.hero;
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <a
        href={ctaHref(primaryCta, phone)}
        className={cn(
          'inline-flex h-12 items-center gap-2 rounded-xl px-6 text-[15px] font-semibold transition',
          hero.button,
        )}
      >
        {primaryCta.kind === 'call' && <Phone className="size-4" aria-hidden />}
        {primaryCta.label}
      </a>
      {secondaryCta && (
        <a
          href={ctaHref(secondaryCta, phone)}
          className={cn(
            'inline-flex h-12 items-center gap-2 rounded-xl px-6 text-[15px] font-medium transition',
            hero.buttonGhost,
          )}
        >
          {secondaryCta.kind === 'call' && <Phone className="size-4" aria-hidden />}
          {secondaryCta.label}
        </a>
      )}
    </div>
  );
}

/* -------------------------------- sections -------------------------------- */

export function Highlights({ site, variant = 'cards' }: { site: Site; variant?: 'cards' | 'plain' }) {
  const items = site.content.highlights;
  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
      <div
        className={cn(
          'grid gap-4',
          items.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2',
        )}
      >
        {items.map((h) => (
          <div
            key={h.title}
            className={cn(
              variant === 'cards'
                ? 'rounded-2xl border border-border bg-card p-6'
                : 'border-t-2 border-primary/50 pt-5',
            )}
          >
            {variant === 'cards' && (
              <span className="mb-4 block h-0.5 w-8 rounded-full bg-primary" aria-hidden />
            )}
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{h.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{h.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Services as a definition list.
 *
 * A `<dl>` rather than cards: these are name-and-description pairs, which is
 * what a definition list is for, and the hairline rows read as a considered
 * catalogue where three floating cards read as filler.
 */
export function Services({ site }: { site: Site }) {
  const items = site.content.services;
  if (items.length === 0) return null;

  return (
    <section id="services" className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
      <SectionHeading title="What we do" />
      <dl className="mt-8 divide-y divide-border border-t border-border">
        {items.map((s) => (
          <div key={s.name} className="grid gap-1.5 py-5 md:grid-cols-[minmax(0,14rem)_1fr] md:gap-8">
            <dt className="text-[15px] font-semibold tracking-[-0.01em]">{s.name}</dt>
            <dd className="text-sm leading-relaxed text-muted-foreground">{s.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Stat figures.
 *
 * `onHero` is a *context* flag — "this instance is being rendered inside the hero
 * band" — not a surface flag. The distinction matters: the same component appears
 * in the Proof section further down the page, which is always on page colours
 * whatever the hero is doing.
 */
export function Stats({
  site,
  onHero = false,
  className,
}: {
  site: Site;
  onHero?: boolean;
  className?: string;
}) {
  const stats = site.content.proof.stats;
  if (stats.length === 0) return null;

  return (
    // `grid-rows-subgrid` on each cell is what keeps the labels on one line
    // together: a value like "Same day" wraps to two lines where "30 days" does
    // not, and without a shared row track that one cell pushes its own label
    // down and the row stops reading as a row.
    <dl
      className={cn(
        'grid grid-rows-[auto_auto] gap-x-8 gap-y-6',
        stats.length >= 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2',
        className,
      )}
    >
      {stats.map((s) => (
        <div key={s.label} className="row-span-2 grid grid-rows-subgrid gap-2">
          {/*
            The label is the term and the figure is its description, so `dt`
            comes first in the DOM — HTML requires it — and the rows are
            assigned explicitly to show the figure above it.
          */}
          <dt
            className={cn(
              'row-start-2 text-xs leading-snug',
              onHero ? 'text-(--site-hero-dim)' : 'text-muted-foreground',
            )}
          >
            {s.label}
          </dt>
          <dd
            className={cn(
              'tnum row-start-1 self-end text-[clamp(1.5rem,2.8vw,2.1rem)] leading-[1.05] font-semibold',
              hero.display,
              onHero ? 'text-(--site-hero-accent)' : 'text-primary',
            )}
          >
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Proof({ site }: { site: Site }) {
  const { stats, quote } = site.content.proof;
  if (stats.length === 0 && !quote) return null;

  return (
    <section className="border-y border-border bg-brand-soft">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
        {quote ? (
          <blockquote>
            <p className="font-display text-[clamp(1.15rem,2.2vw,1.6rem)] leading-[1.4] tracking-[-0.01em]">
              “{quote.text}”
            </p>
            <footer className="mt-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{quote.author}</span>
              {quote.role && <span> · {quote.role}</span>}
            </footer>
          </blockquote>
        ) : (
          <SectionHeading title="By the numbers" />
        )}
        <Stats site={site} className="lg:min-w-[18rem]" />
      </div>
    </section>
  );
}

/**
 * FAQ using native `<details>`.
 *
 * No JS and no library. It is keyboard-accessible, it is searchable by the
 * browser's find-in-page because the content is in the DOM, and it works before
 * hydration — all three of which a bespoke accordion gives up for an animation.
 */
export function Faq({ site, columns = 1 }: { site: Site; columns?: 1 | 2 }) {
  const items = site.content.faq;
  if (items.length === 0) return null;

  return (
    <section id="faq" className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
      <SectionHeading title="Questions people ask" />
      <div
        className={cn(
          'mt-8',
          columns === 2 ? 'columns-1 gap-6 md:columns-2' : 'max-w-3xl',
        )}
      >
        {items.map((f) => (
          <details
            key={f.q}
            className="group mb-3 break-inside-avoid rounded-xl border border-border bg-card px-5 open:bg-accent/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium">
              {f.q}
              <span
                className="grid size-5 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition group-open:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ContactDetails({ site, onHero = false }: { site: Site; onHero?: boolean }) {
  const { email, address, hours } = site.content.contact;
  const rows = [
    site.phoneE164 && {
      icon: Phone,
      label: 'Phone',
      value: prettyPhone(site.phoneE164),
      href: telHref(site.phoneE164),
    },
    hours && { icon: Clock, label: 'Hours', value: hours },
    address && { icon: MapPin, label: 'Address', value: address },
    email && { icon: Mail, label: 'Email', value: email, href: `mailto:${email}` },
  ].filter(Boolean) as {
    icon: typeof Phone;
    label: string;
    value: string;
    href?: string;
  }[];

  if (rows.length === 0) return null;

  return (
    <dl className="space-y-4">
      {rows.map((r) => (
        <div key={r.label} className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl',
              onHero ? 'bg-(--site-hero-card) text-(--site-hero-accent)' : 'bg-accent text-primary',
            )}
            aria-hidden
          >
            <r.icon className="size-4" />
          </span>
          <div className="min-w-0">
            <dt
              className={cn(
                'text-xs font-medium',
                onHero ? 'text-(--site-hero-dim)' : 'text-muted-foreground',
              )}
            >
              {r.label}
            </dt>
            <dd className={cn('text-[15px]', r.label === 'Phone' && 'tnum font-medium')}>
              {r.href ? (
                <a href={r.href} className="hover:underline">
                  {r.value}
                </a>
              ) : (
                r.value
              )}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

/* ---------------------------- header and footer --------------------------- */

/**
 * The header.
 *
 * `onHero` means it sits inside the hero band rather than above it, which is how
 * the `bold` layout works — the band starts at the very top of the page. On a
 * dark or full-brand surface the monogram also needs its own background passed
 * in, because there it cannot inherit `var(--primary)` and stay legible.
 */
export function SiteHeader({
  site,
  onHero = false,
}: {
  site: Site;
  /** True when the header is drawn on the hero surface. */
  onHero?: boolean;
}) {
  const links = [
    site.content.services.length > 0 && { href: '#services', label: 'What we do' },
    site.content.faq.length > 0 && { href: '#faq', label: 'Questions' },
    { href: '#contact', label: 'Contact' },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b backdrop-blur',
        onHero
          ? 'border-(--site-hero-line) bg-(--site-hero-bg)/85 text-(--site-hero-fg)'
          : 'border-border bg-background/85',
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-5 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <TenantLogo
            name={site.name}
            logoUrl={site.logoUrl}
            size={34}
            monogramBackground={onHero ? 'var(--site-hero-card)' : undefined}
            monogramForeground={onHero ? 'var(--site-hero-fg)' : undefined}
          />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-[-0.01em]">{site.name}</p>
            {site.tagline && (
              <p
                className={cn(
                  'truncate text-[11px]',
                  onHero ? 'text-(--site-hero-dim)' : 'text-muted-foreground',
                )}
              >
                {site.tagline}
              </p>
            )}
          </div>
        </div>

        <nav className="ml-auto hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm transition hover:opacity-100',
                onHero ? 'text-(--site-hero-dim)' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {site.phoneE164 ? (
          <a
            href={telHref(site.phoneE164)}
            className={cn(
              'ml-auto inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition md:ml-0',
              onHero ? hero.button : 'bg-primary text-primary-foreground hover:opacity-90',
            )}
          >
            <Phone className="size-4" aria-hidden />
            <span className="tnum hidden sm:inline">{prettyPhone(site.phoneE164)}</span>
            <span className="sm:hidden">Call</span>
          </a>
        ) : (
          <a
            href="#callback"
            className={cn(
              'ml-auto inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition md:ml-0',
              onHero ? hero.button : 'bg-primary text-primary-foreground hover:opacity-90',
            )}
          >
            Request a callback
          </a>
        )}
      </div>
    </header>
  );
}

export function SiteFooter({ site }: { site: Site }) {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2.5">
            <TenantLogo name={site.name} logoUrl={site.logoUrl} size={28} />
            <span className="text-sm font-semibold">{site.name}</span>
          </div>
          {site.content.footerNote && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {site.content.footerNote}
            </p>
          )}
          {site.phoneE164 && (
            <a
              href={telHref(site.phoneE164)}
              className="tnum mt-3 inline-block text-sm font-medium hover:underline"
            >
              {prettyPhone(site.phoneE164)}
            </a>
          )}
        </div>

        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Staff sign in
          </Link>
          <span>
            Calls answered by {PLATFORM_NAME}
          </span>
          <span className="text-muted-foreground/70">
            © {new Date().getFullYear()} {site.name}
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------ contact block ----------------------------- */

/**
 * The contact section, and the page's anchor target.
 *
 * `id="callback"` lives on this element rather than on the form so the heading
 * is what scrolls into view — landing on a bare input with no context is
 * disorienting, and a template that puts the form in its hero overrides this by
 * not rendering the section at all.
 */
export function Contact({
  site,
  form,
  /**
   * Undefined for a template whose hero already holds the form — two elements
   * with `id="callback"` is invalid HTML and the browser would scroll to
   * whichever came first, which is not necessarily the one on screen.
   */
  anchorId = 'callback',
}: {
  site: Site;
  /** The form is a client component, so the template passes it in. */
  form?: React.ReactNode;
  anchorId?: string;
}) {
  const showForm = site.content.contact.showForm && Boolean(form);

  return (
    <section id="contact" className="border-t border-border">
      <div
        id={anchorId}
        className={cn(
          'mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8',
          showForm && 'lg:grid-cols-2 lg:gap-16',
        )}
      >
        <div>
          <SectionHeading
            title={showForm ? 'Ask us to call you' : 'Get in touch'}
            lead={
              showForm
                ? 'Leave a number and someone will ring you back. No queue, no ticket.'
                : undefined
            }
          />
          <div className={cn('mt-8', !showForm && 'max-w-xl')}>
            <ContactDetails site={site} />
          </div>
        </div>
        {showForm && <div className="lg:pt-2">{form}</div>}
      </div>
    </section>
  );
}
