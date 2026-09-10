import { ArrowRight, Phone } from 'lucide-react';
import {
  Contact,
  Faq,
  type Site,
  SiteFooter,
  ctaHref,
  prettyPhone,
  telHref,
} from '@/components/site/parts';
import { form } from './shared';
import type { SiteTemplateModule } from './types';

/**
 * A clone of the Framer "Knotch" template — its layout, not only its palette.
 *
 * The reference's own section flow, read off the live page in a browser:
 *
 *   Hero (950px) · Intro (419) · Process (793, x3) · Solutions (1170, x3)
 *   Case Study (755) · Benefits (725, x5) · Testimonials (805)
 *   Pricing (809) · Comparison (810) · FAQs (534, x7) · CTA (532) · Footer
 *
 * This renders that order, with each section composed the way theirs is: a
 * centred heading above a three-up grid for Process and Solutions, a single
 * oversized statement for Intro, a five-up list for Benefits, and a closing CTA
 * band before the footer.
 *
 * ## What is left out, and why
 *
 * Pricing, Comparison, Case Study and Testimonials need content a contact
 * centre's website scrape does not produce — tiers, a competitor table, project
 * photography, attributed quotes. They are omitted rather than filled with
 * invented tiers or stock faces, which would be the one kind of wrong that
 * reaches a client's customers. Every section below renders only when the
 * scrape actually has something for it.
 *
 * The words are always the tenant's own. Their copy, photographs and licensed
 * display face are theirs; the structure and the measurements are what is
 * ported.
 */
function KnotchPage({ site }: { site: Site }) {
  const { hero: h, highlights, services, steps, faq, proof, sections, gallery, testimonials, pricing, comparison } = site.content;
  const has = (k: string) => sections.includes(k as never);
  const shot = site.logoUrl && /^https?:/.test(site.logoUrl) ? site.logoUrl : null;

  return (
    <div className="sd">
      <header className="sd-head">
        <a href="#top" className="sd-brand">
          <span className="sd-mark" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4.5 13.5H11l-1 8.5 9-12H12l1-8z" />
            </svg>
          </span>
          <span className="sd-brandname">{site.name}</span>
        </a>
        <nav className="sd-nav">
          {has('steps') && steps.length > 0 && <a href="#process">Process</a>}
          {has('services') && services.length > 0 && <a href="#solutions">Solutions</a>}
          {has('faq') && faq.length > 0 && <a href="#faq">FAQs</a>}
          {has('contact') && <a href="#contact">Contact</a>}
        </nav>
        <a href={ctaHref(h.primaryCta, site.phoneE164)} className="sd-btn sd-btn--solid">
          {h.primaryCta.label}
          <span className="sd-arrow" aria-hidden><ArrowRight size={13} /></span>
        </a>
      </header>

      {/* ---- Hero: starfield, chip, tight display, two buttons, stat strip --- */}
      <section className="sd-hero" id="top">
        <div className="sd-hero-inner">
          {h.eyebrow && (
            <span className="sd-chip">
              <em>{h.eyebrow.split(' ')[0]}</em>
              {h.eyebrow.split(' ').slice(1).join(' ')}
            </span>
          )}
          <h1 className="sd-h1">{h.headline}</h1>
          {h.subhead && <p className="sd-sub">{h.subhead}</p>}
          <div className="sd-cta">
            <a href={ctaHref(h.primaryCta, site.phoneE164)} className="sd-btn sd-btn--solid">
              {h.primaryCta.label}
              <span className="sd-arrow" aria-hidden><ArrowRight size={13} /></span>
            </a>
            {site.phoneE164 && (
              <a href={telHref(site.phoneE164)} className="sd-btn sd-btn--ghost tnum">
                {prettyPhone(site.phoneE164)}
                <span className="sd-arrow" aria-hidden><Phone size={12} /></span>
              </a>
            )}
          </div>
        </div>
        {/*
          Their hero closes on a strip of client logos. We have no client
          logos, so the strip carries the centre's own numbers instead — the
          same role in the composition, filled with something true.
        */}
        {has('proof') && proof.stats.length > 0 && (
          <div className="sd-strip">
            {proof.stats.map((s) => (
              <span key={s.label}>
                <strong>{s.value}</strong> {s.label}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ---- Intro: one oversized statement, exactly as theirs does ---- */}
      {site.tagline && (
        <section className="sd-intro">
          <p>{site.tagline}</p>
        </section>
      )}

      {/* ---- Process: heading over a three-up numbered grid ---- */}
      {has('steps') && steps.length > 0 && (
        <section className="sd-wrap" id="process">
          <h2 className="sd-h2 sd-h2--centre">How it works</h2>
          <div className="sd-grid3">
            {steps.map((st, i) => (
              <article key={st.title} className="sd-tile">
                <span className="sd-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{st.title}</h3>
                {st.body && <p>{st.body}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ---- Solutions: heading over a three-up card grid ---- */}
      {has('services') && services.length > 0 && (
        <section className="sd-wrap" id="solutions">
          <h2 className="sd-h2 sd-h2--centre">What we do</h2>
          <div className="sd-grid3">
            {services.map((sv) => (
              <article key={sv.name} className="sd-tile">
                <h3>{sv.name}</h3>
                {sv.body && <p>{sv.body}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ---- Case study: their three-up image row, from the site's own photos ---- */}
      {has('gallery') && gallery.length > 0 && (
        <section className="sd-wrap">
          <h2 className="sd-h2 sd-h2--centre">Our work</h2>
          <div className="sd-cases">
            {gallery.slice(0, 3).map((src) => (
              <div key={src} className="sd-case">
                <img src={src} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      )}
      {/* One wide shot where the scrape found only the social image. */}
      {(!has('gallery') || gallery.length === 0) && shot && (
        <section className="sd-wrap">
          <div className="sd-case sd-case--wide">
            <img src={shot} alt="" />
          </div>
        </section>
      )}

      {/* ---- Benefits: heading over a dense list ---- */}
      {has('highlights') && highlights.length > 0 && (
        <section className="sd-wrap">
          <h2 className="sd-h2 sd-h2--centre">Why choose us</h2>
          <div className="sd-grid-benefits">
            {highlights.map((c) => (
              <div key={c.title} className="sd-benefit">
                <h4>{c.title}</h4>
                {c.body && <p>{c.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Testimonials: their marquee, as a static row ---- */}
      {has('testimonials') && testimonials.length > 0 && (
        <section className="sd-wrap">
          <h2 className="sd-h2 sd-h2--centre">What clients say</h2>
          <div className="sd-quotes">
            {testimonials.map((t) => (
              <figure key={t.quote.slice(0, 40)} className="sd-quote">
                <blockquote>{t.quote}</blockquote>
                <figcaption>
                  <strong>{t.author}</strong>
                  {t.role && <span>{t.role}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ---- Pricing: three tiers, only where the site publishes them ---- */}
      {has('pricing') && pricing.length > 0 && (
        <section className="sd-wrap">
          <h2 className="sd-h2 sd-h2--centre">Pricing</h2>
          <div className="sd-grid3">
            {pricing.map((tier) => (
              <article key={tier.name} className="sd-tier">
                <h3>{tier.name}</h3>
                {tier.price && <p className="sd-price">{tier.price}</p>}
                {tier.note && <p className="sd-tier-note">{tier.note}</p>}
                {tier.features.length > 0 && (
                  <ul>
                    {tier.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}
                <a
                  href={ctaHref(h.primaryCta, site.phoneE164)}
                  className="sd-btn sd-btn--ghost"
                >
                  {h.primaryCta.label}
                  <span className="sd-arrow" aria-hidden><ArrowRight size={13} /></span>
                </a>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ---- Comparison: their two-column before/after ---- */}
      {has('comparison') && (comparison.before.length > 0 || comparison.after.length > 0) && (
        <section className="sd-wrap">
          <h2 className="sd-h2 sd-h2--centre">The difference</h2>
          <div className="sd-vs">
            <div className="sd-vs-col sd-vs-col--before">
              <h4>{comparison.beforeLabel}</h4>
              <ul>
                {comparison.before.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
            <div className="sd-vs-col sd-vs-col--after">
              <h4>{comparison.afterLabel}</h4>
              <ul>
                {comparison.after.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ---- FAQs: centred heading, single column, as theirs ---- */}
      {has('faq') && faq.length > 0 && (
        <section className="sd-wrap sd-faqs" id="faq">
          <h2 className="sd-h2 sd-h2--centre">Frequently asked questions</h2>
          <Faq site={site} columns={1} />
        </section>
      )}

      {/* ---- Closing CTA band, then the form ---- */}
      <section className="sd-wrap">
        <div className="sd-cta-band">
          <h2 className="sd-h2 sd-h2--centre">Speak to us today</h2>
          <div className="sd-cta">
            <a href={ctaHref(h.primaryCta, site.phoneE164)} className="sd-btn sd-btn--solid">
              {h.primaryCta.label}
              <span className="sd-arrow" aria-hidden><ArrowRight size={13} /></span>
            </a>
            {site.phoneE164 && (
              <a href={telHref(site.phoneE164)} className="sd-tel tnum">
                <Phone size={14} aria-hidden /> {prettyPhone(site.phoneE164)}
              </a>
            )}
          </div>
        </div>
      </section>

      {has('contact') && (
        <section className="sd-wrap" id="contact">
          <div className="sd-panel">
            <Contact site={site} form={form(site, 'contact')} />
          </div>
        </section>
      )}

      <SiteFooter site={site} />
    </div>
  );
}

const knotchTheme = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
:root{
  color-scheme:dark;
  --background:#000000; --foreground:#ffffff;
  --card:#0d0d0d; --popover:#0d0d0d;
  --primary:#ffffff; --primary-foreground:#000000;
  --secondary:rgba(255,255,255,.06); --secondary-foreground:#ffffff;
  --muted:#0d0d0d; --muted-foreground:#999999;
  --accent:#1a1a1a; --accent-foreground:#ffffff;
  --border:rgba(255,255,255,.10); --input:rgba(255,255,255,.10); --ring:rgba(255,255,255,.4);
  --radius:16px; --site-radius:16px;
  --font-display-face:'Inter',ui-sans-serif,system-ui,sans-serif;
  --font-sans:'Inter',ui-sans-serif,system-ui,sans-serif;
  --site-display-tracking:-0.04em;
  --site-section-y:6rem; --site-hero-y:8rem;
  --site-hero-bg:transparent; --site-hero-fg:#ffffff;
  --site-hero-dim:#999999; --site-hero-line:rgba(255,255,255,.12);
  --site-hero-card:#1a1a1a; --site-hero-accent:#ffffff;
  --site-hero-btn-bg:#ffffff; --site-hero-btn-fg:#000000;
}
/* The inset slab. This is the template's signature. */
.sd{background:#000;color:#fff;font-family:var(--font-sans);
  margin:0 auto;max-width:1600px;border-radius:0 0 40px 40px;overflow:hidden;}
@media(min-width:1100px){.sd{margin:14px auto;border-radius:56px;}}
.sd *{box-sizing:border-box;}
.sd-head{display:flex;align-items:center;justify-content:space-between;gap:1.5rem;max-width:74rem;
  margin:0 auto;padding:1.5rem;}
.sd-brand{display:inline-flex;align-items:center;gap:.6rem;text-decoration:none;color:#fff;}
.sd-mark{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;
  border-radius:999px;background:#fff;}
.sd-mark svg path{fill:#000;}
.sd-brandname{font-weight:600;letter-spacing:-.03em;font-size:15px;}
.sd-nav{display:none;gap:.35rem;font-size:13.5px;}
.sd-nav a{color:#999;text-decoration:none;padding:10px 15px;border-radius:999px;}
.sd-nav a:hover{color:#fff;background:rgba(255,255,255,.06);}
@media(min-width:900px){.sd-nav{display:flex;}}
.sd-btn{display:inline-flex;align-items:center;gap:.5rem;text-decoration:none;font-size:13.5px;
  font-weight:500;border-radius:999px;padding:9px 9px 9px 18px;transition:opacity .15s ease;}
.sd-btn:hover{opacity:.85;}
.sd-btn--solid{background:#fff;color:#000;}
.sd-btn--ghost{background:rgba(255,255,255,.08);color:#fff;}
.sd-arrow{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;
  border-radius:999px;background:rgba(0,0,0,.14);}
.sd-arrow--lime{background:#000;color:#fff;}
.sd-btn--ghost .sd-arrow{background:#fff;color:#000;}
/* Starfield: two dot layers plus a warm bloom, approximating their backdrop. */
.sd-hero{position:relative;isolation:isolate;overflow:hidden;
  background:
    radial-gradient(120% 80% at 78% 22%,rgba(255,238,210,.10),transparent 55%),
    radial-gradient(100% 70% at 20% 10%,rgba(90,110,190,.14),transparent 60%),
    #000;}
.sd-hero::before,.sd-hero::after{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;}
.sd-hero::before{background-image:radial-gradient(rgba(255,255,255,.55) .9px,transparent 1px);
  background-size:120px 120px;opacity:.7;}
.sd-hero::after{background-image:radial-gradient(rgba(255,255,255,.30) .7px,transparent 1px);
  background-size:47px 61px;opacity:.6;}
.sd-hero-inner{max-width:56rem;margin:0 auto;padding:5rem 1.5rem 0;text-align:center;}
.sd-chip{display:inline-flex;align-items:center;gap:.55rem;background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.14);color:#fff;border-radius:999px;
  padding:4px 14px 4px 4px;font-size:12.5px;}
.sd-chip em{font-style:normal;background:#2563eb;color:#fff;border-radius:999px;padding:3px 10px;font-weight:500;}
.sd-h1{margin:1.7rem 0 0;font-weight:600;font-size:clamp(2.4rem,5.6vw,4.4rem);line-height:1;
  letter-spacing:-.04em;text-wrap:balance;}
.sd-sub{margin:1.4rem auto 0;max-width:30rem;font-size:15.5px;line-height:1.62;color:#999;}
.sd-cta{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.75rem;margin-top:2.1rem;}
.sd-tel{display:inline-flex;align-items:center;gap:.45rem;font-size:13.5px;color:#999;text-decoration:none;}
.sd-shot{margin-top:4rem;padding:0 1.5rem;}
.sd-shot img,.sd-shot-fallback{display:block;width:100%;max-width:74rem;margin:0 auto;
  height:clamp(220px,30vw,420px);object-fit:cover;border-radius:16px;
  border:1px solid rgba(255,255,255,.10);}
.sd-shot-fallback{background:linear-gradient(150deg,#05070f,#101a33 55%,#2a3a66);}
.sd-wrap{max-width:74rem;margin:0 auto;padding:5.5rem 1.5rem 0;}
.sd-h2{font-weight:600;letter-spacing:-.035em;font-size:clamp(1.9rem,3.6vw,3rem);line-height:1.05;
  margin:0 0 2.2rem;text-wrap:balance;}
.sd-stats{display:grid;gap:.6rem;grid-template-columns:repeat(2,1fr);}
@media(min-width:800px){.sd-stats{grid-template-columns:repeat(4,1fr);}}
.sd-stat{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:16px;
  padding:2rem 1.4rem;text-align:center;}
.sd-stat strong{display:block;font-size:2.1rem;font-weight:600;letter-spacing:-.035em;}
.sd-stat span{display:block;margin-top:.4rem;font-size:12.5px;color:#999;}
.sd-cards{display:grid;gap:.6rem;grid-template-columns:1fr;}
@media(min-width:700px){.sd-cards{grid-template-columns:repeat(2,1fr);}}
@media(min-width:1050px){.sd-cards{grid-template-columns:repeat(3,1fr);}}
.sd-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.9rem;}
.sd-card h3{margin:0;font-size:16.5px;font-weight:600;letter-spacing:-.02em;}
.sd-card p{margin:.65rem 0 0;font-size:14px;line-height:1.62;color:#999;}
.sd-benefits{display:grid;gap:2.2rem;}
@media(min-width:960px){.sd-benefits{grid-template-columns:minmax(0,20rem) 1fr;align-items:start;}
  .sd-benefits .sd-h2{margin-bottom:0;}}
.sd-benefit-list{display:grid;gap:.5rem;}
.sd-benefit{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:1.2rem 1.4rem;}
.sd-benefit h4{margin:0;font-size:15px;font-weight:600;}
.sd-benefit p{margin:.4rem 0 0;font-size:13.5px;line-height:1.6;color:#999;}
.sd-steps{display:grid;gap:2.2rem;grid-template-columns:1fr;background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:2.8rem 2rem;}
@media(min-width:700px){.sd-steps{grid-template-columns:repeat(2,1fr);}}
@media(min-width:1050px){.sd-steps{grid-template-columns:repeat(4,1fr);}}
.sd-num{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;
  border-radius:999px;background:#fff;color:#000;font-size:14px;font-weight:700;letter-spacing:-.02em;}
.sd-step h3{margin:1.1rem 0 0;font-size:15.5px;font-weight:600;}
.sd-step p{margin:.45rem 0 0;font-size:13.5px;line-height:1.6;color:#999;}
.sd-faq{display:grid;gap:2.6rem;}
@media(min-width:960px){.sd-faq{grid-template-columns:minmax(0,21rem) 1fr;align-items:start;}}
.sd-help{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:16px;
  padding:1.7rem;margin-top:1.9rem;}
.sd-help h4{margin:0;font-size:15px;font-weight:600;}
.sd-help p{margin:.45rem 0 1.1rem;font-size:13px;line-height:1.55;color:#999;}
.sd-panel{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:2.8rem 2rem;}

/* --- arrangement-specific rules, beyond the shared token set --- */
.sd-strip{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:2.4rem;
  max-width:74rem;margin:4.5rem auto 0;padding:1.6rem 1.5rem;
  border-top:1px solid rgba(255,255,255,.10);font-size:13px;color:#999;}
.sd-strip strong{color:#fff;font-weight:600;letter-spacing:-.02em;}
.sd-intro{max-width:56rem;margin:0 auto;padding:5.5rem 1.5rem 0;}
.sd-intro p{margin:0;font-size:clamp(1.4rem,2.8vw,2.2rem);line-height:1.28;letter-spacing:-.03em;
  font-weight:500;text-align:center;text-wrap:balance;}
.sd-h2--centre{text-align:center;margin-left:auto;margin-right:auto;max-width:34rem;}
.sd-grid3{display:grid;gap:.6rem;grid-template-columns:1fr;}
@media(min-width:760px){.sd-grid3{grid-template-columns:repeat(3,1fr);}}
.sd-tile{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);
  border-radius:20px;padding:2rem 1.75rem;}
.sd-tile h3{margin:0;font-size:16.5px;font-weight:600;letter-spacing:-.02em;}
.sd-tile p{margin:.65rem 0 0;font-size:14px;line-height:1.62;color:#999;}
.sd-tile .sd-num{margin-bottom:1.1rem;}
.sd-grid-benefits{display:grid;gap:.5rem;grid-template-columns:1fr;}
@media(min-width:760px){.sd-grid-benefits{grid-template-columns:repeat(2,1fr);}}
.sd-case{overflow:hidden;border-radius:24px;border:1px solid rgba(255,255,255,.10);}
.sd-case img{display:block;width:100%;height:clamp(240px,32vw,440px);object-fit:cover;}
.sd-faqs{max-width:48rem;}
.sd-cases{display:grid;gap:.6rem;grid-template-columns:1fr;}
@media(min-width:760px){.sd-cases{grid-template-columns:repeat(3,1fr);}}
.sd-quotes{display:grid;gap:.6rem;grid-template-columns:1fr;}
@media(min-width:820px){.sd-quotes{grid-template-columns:repeat(2,1fr);}}
.sd-quote{margin:0;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);
  border-radius:20px;padding:1.9rem;}
.sd-quote blockquote{margin:0;font-size:15.5px;line-height:1.6;letter-spacing:-.01em;}
.sd-quote figcaption{margin-top:1.2rem;display:flex;flex-direction:column;gap:.15rem;font-size:13px;}
.sd-quote figcaption strong{font-weight:600;}
.sd-quote figcaption span{color:#999;}
.sd-tier{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);
  border-radius:20px;padding:2rem 1.75rem;display:flex;flex-direction:column;gap:.9rem;}
.sd-tier h3{margin:0;font-size:15px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#999;}
.sd-price{margin:0;font-size:2.4rem;font-weight:600;letter-spacing:-.04em;}
.sd-tier-note{margin:0;font-size:13.5px;line-height:1.55;color:#999;}
.sd-tier ul{margin:.4rem 0 0;padding:0;list-style:none;display:grid;gap:.55rem;font-size:13.5px;color:#999;}
.sd-tier ul li{padding-left:1.1rem;position:relative;}
.sd-tier ul li::before{content:'';position:absolute;left:0;top:.5em;width:5px;height:5px;
  border-radius:999px;background:#fff;opacity:.6;}
.sd-tier .sd-btn{margin-top:auto;align-self:flex-start;}
.sd-vs{display:grid;gap:.6rem;grid-template-columns:1fr;}
@media(min-width:760px){.sd-vs{grid-template-columns:repeat(2,1fr);}}
.sd-vs-col{border-radius:20px;padding:2rem 1.75rem;border:1px solid rgba(255,255,255,.08);}
.sd-vs-col--before{background:rgba(255,255,255,.03);}
.sd-vs-col--after{background:rgba(255,255,255,.07);}
.sd-vs-col h4{margin:0 0 1.1rem;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#999;}
.sd-vs-col ul{margin:0;padding:0;list-style:none;display:grid;gap:.7rem;font-size:14.5px;line-height:1.5;}
.sd-vs-col--before li{color:#999;}
.sd-vs-col li{padding-left:1.4rem;position:relative;}
.sd-vs-col--before li::before{content:'\\2013';position:absolute;left:0;color:#666;}
.sd-vs-col--after li::before{content:'\\2713';position:absolute;left:0;color:#fff;}
.sd-case--wide img{height:clamp(240px,32vw,440px);}
.sd-cta-band{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.10);
  border-radius:24px;padding:3.4rem 2rem;text-align:center;}
.sd-cta-band .sd-cta{margin-top:1.6rem;}
`;

export const knotchTemplate: SiteTemplateModule = {
  id: 'knotch',
  theme: knotchTheme,
  render: ({ site }) => <KnotchPage site={site} />,
};
