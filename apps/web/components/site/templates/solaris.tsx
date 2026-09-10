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
 * A port of the Framer "Solaris Energy" template.
 *
 * Measured from the rendered page in a real browser, because what makes it
 * look expensive is computed values, not markup:
 *
 *   headline   Host Grotesk 500, 64px / 70.4px, -1.28px, #111, centred
 *   accent     #e2fa5a — the chip, the logo tile, the arrow squares
 *   cards      #f2f2f2 at 24px radius
 *   hero       a sky, centred type, a photograph at its foot
 *
 * Only the words and the photograph change per tenant, and both come from that
 * centre's own scrape. Framer's photographs are deliberately not hotlinked: a
 * solar rooftop on a dental supplier's page is worse than none, and their CDN
 * is not ours to serve from.
 *
 * Pinned light — the original has no dark variant, and half-inverting it to
 * follow a visitor's preference would stop it looking like the reference.
 */
function SolarisPage({ site }: { site: Site }) {
  const { hero: h, highlights, services, steps, faq, proof, sections } = site.content;
  const has = (k: string) => sections.includes(k as never);
  const shot = site.logoUrl && /^https?:/.test(site.logoUrl) ? site.logoUrl : null;

  return (
    <div className="sd">
      {/* ------------------------------- header ------------------------------ */}
      <header className="sd-head">
        <a href="#top" className="sd-brand">
          <span className="sd-mark" aria-hidden>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4.5 13.5H11l-1 8.5 9-12H12l1-8z" fill="#111" />
            </svg>
          </span>
          <span className="sd-brandname">{site.name}</span>
        </a>
        <nav className="sd-nav">
          {has('services') && <a href="#services">Solutions</a>}
          {has('steps') && steps.length > 0 && <a href="#how">How it works</a>}
          {has('faq') && faq.length > 0 && <a href="#faq">FAQ</a>}
          {has('contact') && <a href="#contact">Contact</a>}
        </nav>
        <a href={ctaHref(h.primaryCta, site.phoneE164)} className="sd-btn sd-btn--ghost">
          {h.primaryCta.label}
          <span className="sd-arrow" aria-hidden>
            <ArrowRight size={13} />
          </span>
        </a>
      </header>

      {/* -------------------------------- hero ------------------------------- */}
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
              <span className="sd-arrow sd-arrow--lime" aria-hidden>
                <ArrowRight size={13} />
              </span>
            </a>
            {site.phoneE164 && (
              <a href={telHref(site.phoneE164)} className="sd-tel tnum">
                <Phone size={14} aria-hidden /> {prettyPhone(site.phoneE164)}
              </a>
            )}
          </div>
        </div>
        {/* Their hero photograph sits at the foot of the sky, bleeding out. */}
        <div className="sd-shot">
          {shot ? <img src={shot} alt="" /> : <div className="sd-shot-fallback" aria-hidden />}
        </div>
      </section>

      {/* ------------------------- about + stat cards ------------------------ */}
      {has('proof') && proof.stats.length > 0 && (
        <section className="sd-wrap sd-about">
          <div className="sd-stats">
            {proof.stats.map((s) => (
              <div key={s.label} className="sd-stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --------------------------- solutions cards ------------------------- */}
      {has('services') && services.length > 0 && (
        <section className="sd-wrap" id="services">
          <h2 className="sd-h2">What we do</h2>
          <div className="sd-cards">
            {services.map((s) => (
              <article key={s.name} className="sd-card">
                <h3>{s.name}</h3>
                {s.body && <p>{s.body}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------ benefits ----------------------------- */}
      {has('highlights') && highlights.length > 0 && (
        <section className="sd-wrap sd-benefits">
          <div className="sd-benefits-head">
            <h2 className="sd-h2">Why choose us</h2>
          </div>
          <div className="sd-benefit-list">
            {highlights.map((c) => (
              <div key={c.title} className="sd-benefit">
                <h4>{c.title}</h4>
                {c.body && <p>{c.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ----------------------------- how it works -------------------------- */}
      {has('steps') && steps.length > 0 && (
        <section className="sd-wrap" id="how">
          <h2 className="sd-h2">How it works</h2>
          <div className="sd-steps">
            {steps.map((st, i) => (
              <div key={st.title} className="sd-step">
                <span className="sd-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{st.title}</h3>
                {st.body && <p>{st.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --------------------------------- faq ------------------------------- */}
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
                  <span className="sd-arrow sd-arrow--lime" aria-hidden>
                    <ArrowRight size={13} />
                  </span>
                </a>
              </div>
            )}
          </div>
          <Faq site={site} columns={1} />
        </section>
      )}

      {/* ------------------------------- contact ----------------------------- */}
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

const solarisTheme = `
@import url('https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500;600&family=Geist:wght@400;500;600&display=swap');
:root{
  color-scheme:light;
  --background:#ffffff; --foreground:#111111;
  --card:#ffffff; --popover:#ffffff;
  --primary:#111111; --primary-foreground:#ffffff;
  --secondary:#f2f2f2; --secondary-foreground:#111111;
  --muted:#f2f2f2; --muted-foreground:rgba(17,17,17,.70);
  --accent:#e2fa5a; --accent-foreground:#111111;
  --border:rgba(0,0,0,.10); --input:rgba(0,0,0,.10); --ring:#111111;
  --radius:12px; --site-radius:12px;
  --font-display-face:'Host Grotesk','Instrument Sans',ui-sans-serif,system-ui,sans-serif;
  --font-sans:'Geist','Instrument Sans',ui-sans-serif,system-ui,sans-serif;
  --site-display-tracking:-0.02em;
  --site-section-y:5rem; --site-hero-y:6rem;
  --site-hero-bg:transparent; --site-hero-fg:#111111;
  --site-hero-dim:rgba(17,17,17,.70); --site-hero-line:rgba(0,0,0,.10);
  --site-hero-card:#f2f2f2; --site-hero-accent:#111111;
  --site-hero-btn-bg:#111111; --site-hero-btn-fg:#ffffff;
  --sd-lime:#e2fa5a;
}
.sd{background:#fff;color:#111;font-family:var(--font-sans);}
.sd *{box-sizing:border-box;}

/* header */
.sd-head{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;
  gap:1.5rem;max-width:76rem;margin:0 auto;padding:1.25rem 1.5rem;}
.sd-brand{display:inline-flex;align-items:center;gap:.6rem;text-decoration:none;color:#111;}
.sd-mark{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;
  border-radius:10px;background:var(--sd-lime);}
.sd-brandname{font-family:var(--font-display-face);font-weight:600;letter-spacing:-.02em;font-size:15px;
  text-transform:uppercase;}
.sd-nav{display:none;gap:1.6rem;font-size:14px;}
.sd-nav a{color:#111;text-decoration:none;opacity:.85;}
.sd-nav a:hover{opacity:1;}
@media(min-width:900px){.sd-nav{display:flex;}}

/* buttons: black pill with a lime arrow square, per the reference */
.sd-btn{display:inline-flex;align-items:center;gap:.5rem;text-decoration:none;font-size:14px;
  font-weight:500;border-radius:12px;padding:6px 6px 6px 14px;transition:opacity .15s ease;}
.sd-btn:hover{opacity:.9;}
.sd-btn--solid{background:#111;color:#fff;}
.sd-btn--ghost{background:rgba(17,17,17,.06);color:#111;}
.sd-arrow{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;
  border-radius:8px;background:rgba(255,255,255,.14);}
.sd-arrow--lime{background:var(--sd-lime);color:#111;}
.sd-btn--ghost .sd-arrow{background:#111;color:#fff;}

/* hero: a sky, centred type, a photograph at its foot */
.sd-hero{position:relative;isolation:isolate;overflow:hidden;
  background:linear-gradient(#cfe9f8 0%,#dcf0fb 42%,#eef8fd 78%,#fff 100%);}
.sd-hero::after{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;
  background-image:radial-gradient(rgba(255,255,255,.55) 1px,transparent 1px);background-size:3px 3px;}
.sd-hero-inner{max-width:52rem;margin:0 auto;padding:3.5rem 1.5rem 0;text-align:center;}
.sd-chip{display:inline-flex;align-items:center;gap:.5rem;background:#111;color:#fff;
  border-radius:30px;padding:5px 14px 5px 5px;font-size:13px;}
.sd-chip em{font-style:normal;background:var(--sd-lime);color:#111;border-radius:30px;
  padding:3px 10px;font-weight:500;}
.sd-h1{margin:1.6rem 0 0;font-family:var(--font-display-face);font-weight:500;
  font-size:clamp(2.35rem,5.4vw,4rem);line-height:1.1;letter-spacing:-.02em;color:#111;text-wrap:balance;}
.sd-sub{margin:1.35rem auto 0;max-width:29rem;font-size:15px;line-height:1.6;color:rgba(17,17,17,.70);}
.sd-cta{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.85rem;margin-top:2rem;}
.sd-tel{display:inline-flex;align-items:center;gap:.45rem;font-size:14px;color:rgba(17,17,17,.75);
  text-decoration:none;}
.sd-shot{margin-top:3rem;padding:0 1.5rem;}
.sd-shot img,.sd-shot-fallback{display:block;width:100%;max-width:76rem;margin:0 auto;height:clamp(240px,34vw,460px);
  object-fit:cover;border-radius:20px 20px 0 0;}
.sd-shot-fallback{background:linear-gradient(135deg,#0f2740,#2b6ea8 55%,#8fc6e8);}

/* sections */
.sd-wrap{max-width:76rem;margin:0 auto;padding:4.5rem 1.5rem 0;}
.sd-h2{font-family:var(--font-display-face);font-weight:500;letter-spacing:-.02em;
  font-size:clamp(1.7rem,3.2vw,2.6rem);line-height:1.12;margin:0 0 2rem;text-wrap:balance;}
.sd-stats{display:grid;gap:1px;grid-template-columns:repeat(2,1fr);background:rgba(0,0,0,.08);
  border-radius:24px;overflow:hidden;}
@media(min-width:800px){.sd-stats{grid-template-columns:repeat(4,1fr);}}
.sd-stat{background:#f2f2f2;padding:2rem 1.5rem;text-align:center;}
.sd-stat strong{display:block;font-family:var(--font-display-face);font-size:2rem;font-weight:500;letter-spacing:-.02em;}
.sd-stat span{display:block;margin-top:.35rem;font-size:13px;color:rgba(17,17,17,.65);}
.sd-cards{display:grid;gap:1rem;grid-template-columns:1fr;}
@media(min-width:700px){.sd-cards{grid-template-columns:repeat(2,1fr);}}
@media(min-width:1050px){.sd-cards{grid-template-columns:repeat(3,1fr);}}
.sd-card{background:#f2f2f2;border-radius:24px;padding:1.75rem;}
.sd-card h3{margin:0;font-size:17px;font-weight:600;letter-spacing:-.01em;}
.sd-card p{margin:.6rem 0 0;font-size:14px;line-height:1.6;color:rgba(17,17,17,.70);}
.sd-benefits{display:grid;gap:2rem;}
@media(min-width:960px){.sd-benefits{grid-template-columns:minmax(0,18rem) 1fr;align-items:start;}
  .sd-benefits .sd-h2{margin-bottom:0;}}
.sd-benefit-list{display:grid;gap:.75rem;}
.sd-benefit{background:#fff;border:1px solid rgba(0,0,0,.10);border-radius:16px;padding:1.15rem 1.35rem;}
.sd-benefit h4{margin:0;font-size:15px;font-weight:600;}
.sd-benefit p{margin:.4rem 0 0;font-size:14px;line-height:1.6;color:rgba(17,17,17,.70);}
.sd-steps{display:grid;gap:2rem;grid-template-columns:1fr;background:#f2f2f2;border-radius:24px;padding:2.5rem 2rem;}
@media(min-width:700px){.sd-steps{grid-template-columns:repeat(2,1fr);}}
@media(min-width:1050px){.sd-steps{grid-template-columns:repeat(4,1fr);}}
.sd-num{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;
  border-radius:12px;background:#111;color:var(--sd-lime);font-size:14px;font-weight:600;}
.sd-step h3{margin:1rem 0 0;font-size:16px;font-weight:600;}
.sd-step p{margin:.45rem 0 0;font-size:14px;line-height:1.6;color:rgba(17,17,17,.70);}
.sd-faq{display:grid;gap:2.5rem;}
@media(min-width:960px){.sd-faq{grid-template-columns:minmax(0,20rem) 1fr;align-items:start;}}
.sd-help{background:#f2f2f2;border-radius:24px;padding:1.5rem;margin-top:1.75rem;}
.sd-help h4{margin:0;font-size:15px;font-weight:600;}
.sd-help p{margin:.4rem 0 1rem;font-size:13px;line-height:1.55;color:rgba(17,17,17,.70);}
.sd-panel{background:#f2f2f2;border-radius:24px;padding:2.5rem 2rem;}
`;

export const solarisTemplate: SiteTemplateModule = {
  id: 'solaris',
  theme: solarisTheme,
  render: ({ site }) => <SolarisPage site={site} />,
};
