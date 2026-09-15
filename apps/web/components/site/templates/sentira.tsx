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
 * A clone of the Framer "Sentira" template.
 *
 * The reference's flow, read off the live page (12,765px in total):
 *
 *   Hero 900 (wordmark over a full-bleed image with an overlay) · About 848 x3
 *   Services 1257 x5 (accordion) · Process 855 x3 (numbered) · Testimonial 665
 *   Case Studies 4308 x4 · Comparison 829 (table) · Team 896 · CTA + image
 *
 * Two compositions define it and neither is shared with the other templates:
 * the hero is a single enormous serif word over a photograph, not a sentence on
 * a colour; and Services is a numbered accordion rather than a card grid, which
 * is why it can hold five long entries without becoming a wall.
 *
 * `Team` is omitted — it needs named people with photographs, which a website
 * scrape does not yield and which must not be invented. Every other section
 * renders only when the scrape found something for it.
 */
function SentiraPage({ site }: { site: Site }) {
  const { hero: h, highlights, services, steps, faq, testimonials, comparison, gallery, sections } =
    site.content;
  const has = (k: string) => sections.includes(k as never);
  const shot = gallery[0] ?? (site.logoUrl && /^https?:/.test(site.logoUrl) ? site.logoUrl : null);

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
          {has('services') && services.length > 0 && <a href="#services">Services</a>}
          {has('steps') && steps.length > 0 && <a href="#process">Process</a>}
          {has('faq') && faq.length > 0 && <a href="#faq">FAQ</a>}
          {has('contact') && <a href="#contact">Contact</a>}
        </nav>
        <a href={ctaHref(h.primaryCta, site.phoneE164)} className="sd-btn sd-btn--solid">
          {h.primaryCta.label}
          <span className="sd-arrow" aria-hidden><ArrowRight size={13} /></span>
        </a>
      </header>

      {/* ---- Hero: one enormous serif word over a photograph ---- */}
      <section className="sd-hero" id="top">
        <div className="sd-hero-inner">
          {h.eyebrow && <span className="sd-chip"><em>{h.eyebrow}</em></span>}
          {/*
            The reference sets the *business name* at display size, not the
            proposition — which is why it reads as a house mark. The headline
            becomes the line beneath it.
          */}
          <h1 className="sd-word">{site.name}</h1>
          <p className="sd-lede">{h.headline}</p>
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
        {shot && (
          <div className="sd-hero-shot">
            <img src={shot} alt="" />
            <span className="sd-hero-overlay" aria-hidden />
          </div>
        )}
      </section>

      {/* ---- About: a statement beside three points ---- */}
      {has('highlights') && highlights.length > 0 && (
        <section className="sd-wrap sd-about">
          <h2 className="sd-h2">{h.subhead || 'Built around what you actually do.'}</h2>
          <div className="sd-about-list">
            {highlights.slice(0, 3).map((c) => (
              <div key={c.title}>
                <h4>{c.title}</h4>
                {c.body && <p>{c.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Services: a numbered accordion, their signature ---- */}
      {has('services') && services.length > 0 && (
        <section className="sd-wrap" id="services">
          <h2 className="sd-h2">What we do</h2>
          <div className="sd-accordion">
            {services.map((sv, i) => (
              <details key={sv.name} open={i === 0}>
                <summary>
                  <span className="sd-acc-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="sd-acc-title">{sv.name}</span>
                  <span className="sd-acc-plus" aria-hidden />
                </summary>
                {sv.body && <p>{sv.body}</p>}
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ---- Process: numbered rows ---- */}
      {has('steps') && steps.length > 0 && (
        <section className="sd-wrap" id="process">
          <h2 className="sd-h2">How it works</h2>
          <div className="sd-rows">
            {steps.map((st, i) => (
              <div key={st.title} className="sd-row">
                <span className="sd-num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{st.title}</h3>
                  {st.body && <p>{st.body}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Testimonial: one at a time, large ---- */}
      {has('testimonials') && testimonials.length > 0 && (
        <section className="sd-wrap">
          <div className="sd-quotes">
            {testimonials.slice(0, 2).map((t) => (
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

      {/* ---- Case studies: their tall stacked image blocks ---- */}
      {has('gallery') && gallery.length > 1 && (
        <section className="sd-wrap">
          <h2 className="sd-h2">Our work</h2>
          <div className="sd-stack">
            {gallery.slice(1, 5).map((src, i) => (
              <figure key={src} className="sd-case">
                <img src={src} alt="" loading="lazy" />
                <figcaption>{String(i + 1).padStart(2, '0')}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ---- Comparison: their table ---- */}
      {has('comparison') && (comparison.before.length > 0 || comparison.after.length > 0) && (
        <section className="sd-wrap">
          <h2 className="sd-h2">What makes us different</h2>
          <div className="sd-table">
            <div className="sd-table-col">
              <h4>{comparison.beforeLabel}</h4>
              {comparison.before.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
            <div className="sd-table-col sd-table-col--ours">
              <h4>{comparison.afterLabel}</h4>
              {comparison.after.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {has('faq') && faq.length > 0 && (
        <section className="sd-wrap sd-faq" id="faq">
          <div>
            <h2 className="sd-h2">Your questions answered</h2>
            {site.phoneE164 && (
              <div className="sd-help">
                <h4>Need more help?</h4>
                <p>Speak to someone now — the line is answered immediately.</p>
                <a href={telHref(site.phoneE164)} className="sd-btn sd-btn--solid tnum">
                  {prettyPhone(site.phoneE164)}
                  <span className="sd-arrow" aria-hidden><ArrowRight size={13} /></span>
                </a>
              </div>
            )}
          </div>
          <Faq site={site} columns={1} />
        </section>
      )}

      {/* ---- Closing CTA, then their bottom image ---- */}
      {has('contact') && (
        <section className="sd-wrap" id="contact">
          <div className="sd-panel">
            <Contact site={site} form={form(site, 'contact')} />
          </div>
        </section>
      )}
      {gallery.length > 5 && (
        <div className="sd-bottom-shot">
          <img src={gallery[5]} alt="" loading="lazy" />
        </div>
      )}

      <SiteFooter site={site} />
    </div>
  );
}

const sentiraTheme = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500&display=swap');
:root{
  color-scheme:dark;
  --background:#060606; --foreground:#ffffff;
  --card:#121212; --popover:#121212;
  --primary:#ffffff; --primary-foreground:#060606;
  --secondary:#1e1e1e; --secondary-foreground:#ffffff;
  --muted:#121212; --muted-foreground:rgba(255,255,255,.60);
  --accent:#1e1e1e; --accent-foreground:#ffffff;
  --border:rgba(255,255,255,.10); --input:rgba(255,255,255,.10); --ring:rgba(255,255,255,.45);
  --radius:14px; --site-radius:14px;
  --font-display-face:'Instrument Serif',ui-serif,Georgia,serif;
  --font-sans:'Inter',ui-sans-serif,system-ui,sans-serif;
  --site-display-tracking:-0.015em;
  --site-section-y:6rem; --site-hero-y:7rem;
  --site-hero-bg:transparent; --site-hero-fg:#ffffff;
  --site-hero-dim:rgba(255,255,255,.60); --site-hero-line:rgba(255,255,255,.12);
  --site-hero-card:#121212; --site-hero-accent:#ffffff;
  --site-hero-btn-bg:#ffffff; --site-hero-btn-fg:#060606;
}
.sd{background:#060606;color:#fff;font-family:var(--font-sans);}
.sd *{box-sizing:border-box;}
.sd-head{display:flex;align-items:center;justify-content:space-between;gap:1.5rem;max-width:74rem;
  margin:0 auto;padding:1.5rem;}
.sd-brand{display:inline-flex;align-items:center;gap:.65rem;text-decoration:none;color:#fff;}
.sd-mark{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;
  border-radius:999px;background:#fff;}
.sd-mark svg path{fill:#060606;}
.sd-brandname{font-family:var(--font-display-face);font-size:19px;letter-spacing:-.01em;}
.sd-nav{display:none;gap:1.7rem;font-size:13.5px;}
.sd-nav a{color:rgba(255,255,255,.6);text-decoration:none;}
.sd-nav a:hover{color:#fff;}
@media(min-width:900px){.sd-nav{display:flex;}}
.sd-btn{display:inline-flex;align-items:center;gap:.5rem;text-decoration:none;font-size:13.5px;
  font-weight:500;border-radius:999px;padding:8px 8px 8px 16px;transition:opacity .15s ease;}
.sd-btn:hover{opacity:.85;}
.sd-btn--solid{background:#fff;color:#060606;}
.sd-btn--ghost{background:#1e1e1e;color:#fff;}
.sd-arrow{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;
  border-radius:999px;background:rgba(6,6,6,.14);}
.sd-arrow--lime{background:#060606;color:#fff;}
.sd-btn--ghost .sd-arrow{background:#fff;color:#060606;}
.sd-hero{background:radial-gradient(90% 60% at 50% 0%,#181818,transparent 70%),#060606;}
.sd-hero-inner{max-width:60rem;margin:0 auto;padding:4.5rem 1.5rem 0;text-align:center;}
.sd-chip{display:inline-flex;align-items:center;gap:.5rem;background:#121212;
  border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.7);border-radius:999px;
  padding:5px 14px 5px 5px;font-size:12px;}
.sd-chip em{font-style:normal;background:#fff;color:#060606;border-radius:999px;padding:3px 10px;font-weight:500;}
/* The one loud decision: an enormous serif. */
.sd-h1{margin:2rem 0 0;font-family:var(--font-display-face);font-weight:400;
  font-size:clamp(3rem,9vw,7.5rem);line-height:.95;letter-spacing:-.02em;text-wrap:balance;}
.sd-sub{margin:1.8rem auto 0;max-width:30rem;font-size:15.5px;line-height:1.7;color:rgba(255,255,255,.6);}
.sd-cta{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.85rem;margin-top:2.3rem;}
.sd-tel{display:inline-flex;align-items:center;gap:.45rem;font-size:13.5px;color:rgba(255,255,255,.6);text-decoration:none;}
.sd-shot{margin-top:3.5rem;padding:0 1.5rem;}
.sd-shot img,.sd-shot-fallback{display:block;width:100%;max-width:74rem;margin:0 auto;
  height:clamp(230px,32vw,450px);object-fit:cover;border-radius:14px;}
.sd-shot-fallback{background:linear-gradient(140deg,#121212,#2a2a2a 60%,#454545);}
.sd-wrap{max-width:74rem;margin:0 auto;padding:5.5rem 1.5rem 0;}
.sd-h2{font-family:var(--font-display-face);font-weight:400;letter-spacing:-.015em;
  font-size:clamp(2rem,4vw,3.2rem);line-height:1.06;margin:0 0 2.2rem;text-wrap:balance;}
.sd-stats{display:grid;gap:1rem;grid-template-columns:repeat(2,1fr);}
@media(min-width:800px){.sd-stats{grid-template-columns:repeat(4,1fr);}}
.sd-stat{background:#121212;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:2rem 1.4rem;text-align:center;}
.sd-stat strong{display:block;font-family:var(--font-display-face);font-size:2.4rem;font-weight:400;}
.sd-stat span{display:block;margin-top:.4rem;font-size:12.5px;color:rgba(255,255,255,.55);}
.sd-cards{display:grid;gap:1rem;grid-template-columns:1fr;}
@media(min-width:700px){.sd-cards{grid-template-columns:repeat(2,1fr);}}
@media(min-width:1050px){.sd-cards{grid-template-columns:repeat(3,1fr);}}
.sd-card{background:#121212;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:1.9rem;}
.sd-card h3{margin:0;font-family:var(--font-display-face);font-size:20px;font-weight:400;}
.sd-card p{margin:.7rem 0 0;font-size:14px;line-height:1.7;color:rgba(255,255,255,.6);}
.sd-benefits{display:grid;gap:2.2rem;}
@media(min-width:960px){.sd-benefits{grid-template-columns:minmax(0,20rem) 1fr;align-items:start;}
  .sd-benefits .sd-h2{margin-bottom:0;}}
.sd-benefit-list{display:grid;gap:.65rem;}
.sd-benefit{background:#121212;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:1.2rem 1.4rem;}
.sd-benefit h4{margin:0;font-size:15px;font-weight:500;}
.sd-benefit p{margin:.4rem 0 0;font-size:13.5px;line-height:1.65;color:rgba(255,255,255,.6);}
.sd-steps{display:grid;gap:2.2rem;grid-template-columns:1fr;background:#0d0d0d;
  border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:2.8rem 2rem;}
@media(min-width:700px){.sd-steps{grid-template-columns:repeat(2,1fr);}}
@media(min-width:1050px){.sd-steps{grid-template-columns:repeat(4,1fr);}}
.sd-num{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;
  border-radius:999px;background:#fff;color:#060606;font-family:var(--font-display-face);font-size:16px;}
.sd-step h3{margin:1.1rem 0 0;font-family:var(--font-display-face);font-size:18px;font-weight:400;}
.sd-step p{margin:.45rem 0 0;font-size:13.5px;line-height:1.65;color:rgba(255,255,255,.6);}
.sd-faq{display:grid;gap:2.6rem;}
@media(min-width:960px){.sd-faq{grid-template-columns:minmax(0,21rem) 1fr;align-items:start;}}
.sd-help{background:#121212;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:1.7rem;margin-top:1.9rem;}
.sd-help h4{margin:0;font-family:var(--font-display-face);font-size:18px;font-weight:400;}
.sd-help p{margin:.45rem 0 1.1rem;font-size:13px;line-height:1.6;color:rgba(255,255,255,.6);}
.sd-panel{background:#121212;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:2.8rem 2rem;}

/* --- arrangement-specific rules --- */
.sd-word{margin:1.6rem 0 0;font-family:var(--font-display-face);font-weight:400;
  font-size:clamp(3.4rem,13vw,10.5rem);line-height:.9;letter-spacing:-.03em;}
.sd-lede{margin:1.6rem auto 0;max-width:34rem;font-size:clamp(1.05rem,1.7vw,1.35rem);
  line-height:1.5;color:rgba(255,255,255,.72);text-wrap:balance;}
.sd-hero-shot{position:relative;margin-top:3.5rem;}
.sd-hero-shot img{display:block;width:100%;height:clamp(280px,44vw,620px);object-fit:cover;}
.sd-hero-overlay{position:absolute;inset:0;
  background:linear-gradient(to bottom,rgba(6,6,6,.35) 0%,rgba(6,6,6,0) 35%,rgba(6,6,6,.95) 100%);}
.sd-about{display:grid;gap:2.4rem;}
@media(min-width:960px){.sd-about{grid-template-columns:minmax(0,26rem) 1fr;align-items:start;}
  .sd-about .sd-h2{margin-bottom:0;}}
.sd-about-list{display:grid;gap:1.6rem;}
.sd-about-list h4{margin:0;font-family:var(--font-display-face);font-size:20px;font-weight:400;}
.sd-about-list p{margin:.45rem 0 0;font-size:14.5px;line-height:1.7;color:rgba(255,255,255,.6);}
/* Services accordion — the signature composition. */
.sd-accordion{border-top:1px solid rgba(255,255,255,.12);}
.sd-accordion details{border-bottom:1px solid rgba(255,255,255,.12);}
.sd-accordion summary{display:flex;align-items:center;gap:1.4rem;padding:1.5rem 0;cursor:pointer;
  list-style:none;}
.sd-accordion summary::-webkit-details-marker{display:none;}
.sd-acc-num{font-size:12.5px;color:rgba(255,255,255,.45);min-width:2rem;}
.sd-acc-title{flex:1;font-family:var(--font-display-face);font-size:clamp(1.2rem,2.4vw,1.9rem);
  font-weight:400;letter-spacing:-.015em;}
.sd-acc-plus{position:relative;width:14px;height:14px;flex:none;}
.sd-acc-plus::before,.sd-acc-plus::after{content:'';position:absolute;background:rgba(255,255,255,.6);}
.sd-acc-plus::before{left:0;top:6px;width:14px;height:2px;}
.sd-acc-plus::after{left:6px;top:0;width:2px;height:14px;transition:opacity .15s ease;}
.sd-accordion details[open] .sd-acc-plus::after{opacity:0;}
.sd-accordion details p{margin:0 0 1.6rem;padding-left:3.4rem;max-width:44rem;
  font-size:14.5px;line-height:1.75;color:rgba(255,255,255,.6);}
.sd-rows{display:grid;gap:0;border-top:1px solid rgba(255,255,255,.12);}
.sd-row{display:flex;gap:1.6rem;padding:1.7rem 0;border-bottom:1px solid rgba(255,255,255,.12);}
.sd-row h3{margin:0;font-family:var(--font-display-face);font-size:19px;font-weight:400;}
.sd-row p{margin:.4rem 0 0;font-size:14px;line-height:1.7;color:rgba(255,255,255,.6);max-width:44rem;}
.sd-quotes{display:grid;gap:1rem;}
@media(min-width:900px){.sd-quotes{grid-template-columns:repeat(2,1fr);}}
.sd-quote{margin:0;background:#121212;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:2.2rem;}
.sd-quote blockquote{margin:0;font-family:var(--font-display-face);font-size:clamp(1.1rem,1.9vw,1.5rem);
  line-height:1.42;font-weight:400;}
.sd-quote figcaption{margin-top:1.4rem;display:flex;flex-direction:column;gap:.1rem;font-size:13px;}
.sd-quote figcaption span{color:rgba(255,255,255,.55);}
.sd-stack{display:grid;gap:1rem;}
@media(min-width:900px){.sd-stack{grid-template-columns:repeat(2,1fr);}}
.sd-case{position:relative;margin:0;overflow:hidden;border-radius:14px;}
.sd-case img{display:block;width:100%;height:clamp(240px,26vw,380px);object-fit:cover;}
.sd-case figcaption{position:absolute;left:1.1rem;top:1.1rem;background:rgba(6,6,6,.72);
  border-radius:999px;padding:4px 12px;font-size:12px;}
.sd-table{display:grid;gap:1rem;}
@media(min-width:820px){.sd-table{grid-template-columns:repeat(2,1fr);}}
.sd-table-col{border:1px solid rgba(255,255,255,.10);border-radius:14px;padding:2rem 1.8rem;}
.sd-table-col--ours{background:#121212;}
.sd-table-col h4{margin:0 0 1.2rem;font-size:12.5px;text-transform:uppercase;letter-spacing:.1em;
  color:rgba(255,255,255,.5);}
.sd-table-col p{margin:0 0 .85rem;font-size:14.5px;line-height:1.55;color:rgba(255,255,255,.72);}
.sd-table-col--ours p{color:#fff;}
.sd-bottom-shot{margin-top:5rem;}
.sd-bottom-shot img{display:block;width:100%;height:clamp(200px,26vw,440px);object-fit:cover;}
`;

export const sentiraTemplate: SiteTemplateModule = {
  id: 'sentira',
  theme: sentiraTheme,
  render: ({ site }) => <SentiraPage site={site} />,
};
