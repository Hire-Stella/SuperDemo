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
 * After the Framer "Nudge" portfolio template.
 *
 * The reference's flow (8,157px): a loader, then Hero + About 1868 (a wordmark
 * with rotated tag chips around it), About 862 beside an image, Feature Works
 * 4229 as four stacked project blocks of ~950px each, and a tall CTA 1560.
 *
 * That order is what this renders. The hero is the one composition none of the
 * other three share: the display is *left*-ranged and set in uppercase at
 * weight 900 over a blueprint grid, with small rotated chips beside it.
 *
 * ## Where this stops being a clone
 *
 * Its charm is hand-drawn: cursor arrows, selection handles, a ruler along the
 * top, inline emoji. The chips and the grid port cleanly and are done here; the
 * artwork is not reproduced, because it is illustration belonging to that
 * template rather than a layout decision, and a redrawn approximation would
 * look worse than its absence. The loader is dropped too — a splash screen on a
 * tenant's landing page costs a visitor time for nothing.
 */
function NudgePage({ site }: { site: Site }) {
  const { hero: h, highlights, services, steps, faq, gallery, testimonials, sections } =
    site.content;
  const has = (k: string) => sections.includes(k as never);
  const aboutShot = gallery[0] ?? (site.logoUrl && /^https?:/.test(site.logoUrl) ? site.logoUrl : null);
  const works = gallery.slice(1, 5);

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
          {works.length > 0 && <a href="#work">Work</a>}
          {has('faq') && faq.length > 0 && <a href="#faq">FAQ</a>}
          {has('contact') && <a href="#contact">Contact</a>}
        </nav>
        <a href={ctaHref(h.primaryCta, site.phoneE164)} className="sd-btn sd-btn--solid">
          {h.primaryCta.label}
          <span className="sd-arrow sd-arrow--lime" aria-hidden><ArrowRight size={13} /></span>
        </a>
      </header>

      {/* ---- Hero: left-ranged uppercase wordmark on a blueprint grid ---- */}
      <section className="sd-hero" id="top">
        <div className="sd-hero-inner">
          {/* Their rotated tags. Two, from real values, not decoration. */}
          <div className="sd-tags">
            {h.eyebrow && <span className="sd-tag sd-tag--a">{h.eyebrow}</span>}
            {site.content.contact.address && (
              <span className="sd-tag sd-tag--b">{site.content.contact.address}</span>
            )}
          </div>
          <h1 className="sd-h1">{site.name}</h1>
          <p className="sd-avail">
            <span className="sd-dot" aria-hidden /> {h.headline}
          </p>
          {h.subhead && <p className="sd-sub">{h.subhead}</p>}
          <div className="sd-cta">
            <a href={ctaHref(h.primaryCta, site.phoneE164)} className="sd-btn sd-btn--solid">
              {h.primaryCta.label}
              <span className="sd-arrow sd-arrow--lime" aria-hidden><ArrowRight size={13} /></span>
            </a>
            {site.phoneE164 && (
              <a href={telHref(site.phoneE164)} className="sd-tel tnum">
                <Phone size={14} aria-hidden /> {prettyPhone(site.phoneE164)}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ---- About: copy beside a single portrait-ish image ---- */}
      {has('highlights') && highlights.length > 0 && (
        <section className="sd-wrap sd-about">
          <div>
            <h2 className="sd-h2">About</h2>
            <div className="sd-about-list">
              {highlights.slice(0, 4).map((c) => (
                <div key={c.title}>
                  <h4>{c.title}</h4>
                  {c.body && <p>{c.body}</p>}
                </div>
              ))}
            </div>
          </div>
          {aboutShot && (
            <div className="sd-about-shot">
              <img src={aboutShot} alt="" loading="lazy" />
            </div>
          )}
        </section>
      )}

      {/* ---- Services ---- */}
      {has('services') && services.length > 0 && (
        <section className="sd-wrap" id="services">
          <h2 className="sd-h2">What I do</h2>
          <div className="sd-cards">
            {services.map((sv) => (
              <article key={sv.name} className="sd-card">
                <h3>{sv.name}</h3>
                {sv.body && <p>{sv.body}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ---- Featured works: their tall stacked project blocks ---- */}
      {works.length > 0 && (
        <section className="sd-wrap" id="work">
          <h2 className="sd-h2">Featured work</h2>
          <div className="sd-projects">
            {works.map((src, i) => (
              <article key={src} className="sd-project">
                <div className="sd-project-shot">
                  <img src={src} alt="" loading="lazy" />
                </div>
                <div className="sd-project-meta">
                  <span className="sd-project-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{services[i]?.name ?? highlights[i]?.title ?? 'Selected work'}</h3>
                  {(services[i]?.body || highlights[i]?.body) && (
                    <p>{services[i]?.body || highlights[i]?.body}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ---- Process, where the site describes one ---- */}
      {has('steps') && steps.length > 0 && (
        <section className="sd-wrap">
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

      {has('testimonials') && testimonials.length > 0 && (
        <section className="sd-wrap">
          <h2 className="sd-h2">Kind words</h2>
          <div className="sd-quotes">
            {testimonials.slice(0, 3).map((t) => (
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

      {has('faq') && faq.length > 0 && (
        <section className="sd-wrap sd-faq" id="faq">
          <div>
            <h2 className="sd-h2">FAQ</h2>
            {site.phoneE164 && (
              <div className="sd-help">
                <h4>Rather just talk?</h4>
                <p>The line is answered straight away.</p>
                <a href={telHref(site.phoneE164)} className="sd-btn sd-btn--solid tnum">
                  {prettyPhone(site.phoneE164)}
                  <span className="sd-arrow sd-arrow--lime" aria-hidden><ArrowRight size={13} /></span>
                </a>
              </div>
            )}
          </div>
          <Faq site={site} columns={1} />
        </section>
      )}

      {/* ---- Their tall closing CTA ---- */}
      {has('contact') && (
        <section className="sd-wrap" id="contact">
          <div className="sd-lets-talk">
            <h2 className="sd-h2">Let&rsquo;s talk</h2>
            <div className="sd-panel">
              <Contact site={site} form={form(site, 'contact')} />
            </div>
          </div>
        </section>
      )}

      <SiteFooter site={site} />
    </div>
  );
}

const nudgeTheme = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;900&family=Inter:wght@400;500&display=swap');
:root{
  color-scheme:light;
  --background:#ffffff; --foreground:#111212;
  --card:#ffffff; --popover:#ffffff;
  --primary:#111212; --primary-foreground:#ffffff;
  --secondary:#ededed; --secondary-foreground:#111212;
  --muted:#f6f6f6; --muted-foreground:#aaabab;
  --accent:#36c5f0; --accent-foreground:#111212;
  --border:#ededed; --input:#ededed; --ring:#36c5f0;
  --radius:16px; --site-radius:16px;
  --font-display-face:'Archivo',ui-sans-serif,system-ui,sans-serif;
  --font-sans:'Inter',ui-sans-serif,system-ui,sans-serif;
  --site-display-tracking:-0.025em;
  --site-section-y:5.5rem; --site-hero-y:6rem;
  --site-hero-bg:transparent; --site-hero-fg:#111212;
  --site-hero-dim:#aaabab; --site-hero-line:#ededed;
  --site-hero-card:#f6f6f6; --site-hero-accent:#e01e5a;
  --site-hero-btn-bg:#111212; --site-hero-btn-fg:#ffffff;
}
.sd{background:#fff;color:#111212;font-family:var(--font-sans);}
.sd *{box-sizing:border-box;}
.sd-head{display:flex;align-items:center;justify-content:space-between;gap:1.5rem;max-width:82rem;
  margin:0 auto;padding:1.1rem 1.5rem;border-bottom:1px solid #ededed;}
.sd-brand{display:inline-flex;align-items:center;gap:.6rem;text-decoration:none;color:#111212;}
.sd-mark{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;
  border-radius:8px;background:#36c5f0;}
.sd-mark svg path{fill:#111212;}
.sd-brandname{font-family:var(--font-display-face);font-weight:900;letter-spacing:-.02em;font-size:14px;
  text-transform:uppercase;}
.sd-nav{display:none;gap:.25rem;font-size:12px;text-transform:uppercase;letter-spacing:.06em;}
.sd-nav a{color:#111212;text-decoration:none;padding:8px 12px;border-radius:8px;font-weight:500;}
.sd-nav a:hover{background:#f6f6f6;}
@media(min-width:900px){.sd-nav{display:flex;}}
.sd-btn{display:inline-flex;align-items:center;gap:.5rem;text-decoration:none;font-size:12px;
  font-weight:700;text-transform:uppercase;letter-spacing:.06em;border-radius:10px;
  padding:8px 8px 8px 14px;transition:transform .12s ease;}
.sd-btn:hover{transform:translateY(-1px);}
.sd-btn--solid{background:#111212;color:#fff;}
.sd-btn--ghost{background:#fff;border:1.5px solid #111212;color:#111212;}
.sd-arrow{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;
  border-radius:6px;background:rgba(255,255,255,.16);}
.sd-arrow--lime{background:#36c5f0;color:#111212;}
.sd-btn--ghost .sd-arrow{background:#e01e5a;color:#fff;}
/* Blueprint grid, and a left-ranged hero — the two things that make it Nudge. */
.sd-hero{background:
  linear-gradient(#ededed 1px,transparent 1px) 0 0/100% 100px,
  linear-gradient(90deg,#ededed 1px,transparent 1px) 0 0/100px 100%,
  #fff;}
.sd-hero-inner{max-width:82rem;margin:0 auto;padding:4.5rem 1.5rem 0;text-align:left;}
.sd-chip{display:inline-flex;align-items:center;gap:.5rem;background:#ecb22e;color:#111212;
  border-radius:8px;padding:5px 12px 5px 5px;font-size:11.5px;font-weight:600;
  text-transform:uppercase;letter-spacing:.06em;transform:rotate(-1.5deg);}
.sd-chip em{font-style:normal;background:#111212;color:#ecb22e;border-radius:6px;padding:3px 8px;}
.sd-h1{margin:1.6rem 0 0;font-family:var(--font-display-face);font-weight:900;
  font-size:clamp(2.6rem,8.4vw,6.5rem);line-height:.92;letter-spacing:-.025em;
  text-transform:uppercase;max-width:20ch;}
.sd-sub{margin:1.6rem 0 0;max-width:34rem;font-size:16px;line-height:1.62;color:#aaabab;}
.sd-cta{display:flex;flex-wrap:wrap;align-items:center;gap:.85rem;margin-top:2rem;}
.sd-tel{display:inline-flex;align-items:center;gap:.45rem;font-size:13px;color:#aaabab;text-decoration:none;}
.sd-shot{margin-top:3.2rem;padding:0 1.5rem;}
.sd-shot img,.sd-shot-fallback{display:block;width:100%;max-width:82rem;margin:0 auto;
  height:clamp(240px,34vw,480px);object-fit:cover;border-radius:32px;}
.sd-shot-fallback{background:linear-gradient(120deg,#36c5f0,#e01e5a 55%,#ecb22e);}
.sd-wrap{max-width:82rem;margin:0 auto;padding:5rem 1.5rem 0;}
.sd-h2{font-family:var(--font-display-face);font-weight:900;letter-spacing:-.025em;
  font-size:clamp(1.9rem,4.4vw,3.4rem);line-height:.98;margin:0 0 2rem;text-transform:uppercase;}
.sd-stats{display:grid;gap:.75rem;grid-template-columns:repeat(2,1fr);}
@media(min-width:800px){.sd-stats{grid-template-columns:repeat(4,1fr);}}
.sd-stat{background:#f6f6f6;border-radius:24px;padding:2rem 1.4rem;}
.sd-stat strong{display:block;font-family:var(--font-display-face);font-size:2.4rem;font-weight:900;letter-spacing:-.03em;}
.sd-stat span{display:block;margin-top:.4rem;font-size:11.5px;font-weight:600;text-transform:uppercase;
  letter-spacing:.06em;color:#aaabab;}
.sd-cards{display:grid;gap:.75rem;grid-template-columns:1fr;}
@media(min-width:700px){.sd-cards{grid-template-columns:repeat(2,1fr);}}
@media(min-width:1050px){.sd-cards{grid-template-columns:repeat(3,1fr);}}
.sd-card{background:#f6f6f6;border-radius:24px;padding:1.9rem;}
.sd-card h3{margin:0;font-family:var(--font-display-face);font-size:16px;font-weight:900;
  text-transform:uppercase;letter-spacing:-.01em;}
.sd-card p{margin:.7rem 0 0;font-size:14px;line-height:1.62;color:#aaabab;}
.sd-benefits{display:grid;gap:2rem;}
@media(min-width:960px){.sd-benefits{grid-template-columns:minmax(0,20rem) 1fr;align-items:start;}
  .sd-benefits .sd-h2{margin-bottom:0;}}
.sd-benefit-list{display:grid;gap:.6rem;}
.sd-benefit{background:#fff;border:1.5px solid #ededed;border-radius:16px;padding:1.2rem 1.4rem;}
.sd-benefit h4{margin:0;font-size:15px;font-weight:700;}
.sd-benefit p{margin:.4rem 0 0;font-size:13.5px;line-height:1.6;color:#aaabab;}
.sd-steps{display:grid;gap:2rem;grid-template-columns:1fr;background:#f6f6f6;border-radius:40px;padding:2.8rem 2rem;}
@media(min-width:700px){.sd-steps{grid-template-columns:repeat(2,1fr);}}
@media(min-width:1050px){.sd-steps{grid-template-columns:repeat(4,1fr);}}
/* Each step takes a different accent, which is how Nudge uses colour. */
.sd-num{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;
  border-radius:12px;background:#111212;color:#fff;font-family:var(--font-display-face);
  font-size:14px;font-weight:900;}
.sd-step:nth-child(1) .sd-num{background:#36c5f0;color:#111212;}
.sd-step:nth-child(2) .sd-num{background:#e01e5a;color:#fff;}
.sd-step:nth-child(3) .sd-num{background:#ecb22e;color:#111212;}
.sd-step h3{margin:1.1rem 0 0;font-family:var(--font-display-face);font-size:15px;font-weight:900;
  text-transform:uppercase;}
.sd-step p{margin:.45rem 0 0;font-size:13.5px;line-height:1.6;color:#aaabab;}
.sd-faq{display:grid;gap:2.4rem;}
@media(min-width:960px){.sd-faq{grid-template-columns:minmax(0,21rem) 1fr;align-items:start;}}
.sd-help{background:#36c5f0;border-radius:24px;padding:1.7rem;margin-top:1.8rem;}
.sd-help h4{margin:0;font-family:var(--font-display-face);font-size:16px;font-weight:900;text-transform:uppercase;}
.sd-help p{margin:.45rem 0 1.1rem;font-size:13px;line-height:1.55;color:rgba(17,18,18,.72);}
.sd-panel{background:#f6f6f6;border-radius:40px;padding:2.8rem 2rem;}

/* --- arrangement-specific rules --- */
.sd-tags{display:flex;flex-wrap:wrap;gap:.9rem;margin-bottom:1.6rem;}
.sd-tag{display:inline-block;padding:7px 14px;border-radius:8px;font-size:11.5px;font-weight:600;
  text-transform:uppercase;letter-spacing:.06em;box-shadow:0 2px 0 rgba(17,18,18,.9);}
.sd-tag--a{background:#a7e8c4;color:#111212;transform:rotate(-2.2deg);}
.sd-tag--b{background:#f6dfa0;color:#111212;transform:rotate(1.8deg);}
.sd-avail{display:inline-flex;align-items:center;gap:.55rem;margin:1.4rem 0 0;font-size:12.5px;
  font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:#111212;}
.sd-dot{width:9px;height:9px;border-radius:999px;background:#36c5f0;flex:none;}
.sd-about{display:grid;gap:2.4rem;}
@media(min-width:960px){.sd-about{grid-template-columns:1fr minmax(0,22rem);align-items:start;}}
.sd-about-list{display:grid;gap:1.4rem;}
.sd-about-list h4{margin:0;font-family:var(--font-display-face);font-size:15px;font-weight:900;
  text-transform:uppercase;}
.sd-about-list p{margin:.35rem 0 0;font-size:14.5px;line-height:1.68;color:#aaabab;}
.sd-about-shot{overflow:hidden;border-radius:32px;}
.sd-about-shot img{display:block;width:100%;height:clamp(280px,32vw,420px);object-fit:cover;}
/* Project blocks: an image with its meta below, stacked tall like theirs. */
.sd-projects{display:grid;gap:2.5rem;}
.sd-project-shot{overflow:hidden;border-radius:32px;background:#f6f6f6;}
.sd-project-shot img{display:block;width:100%;height:clamp(260px,38vw,540px);object-fit:cover;}
.sd-project-meta{display:flex;align-items:baseline;gap:1.1rem;padding:1.2rem .4rem 0;}
.sd-project-num{font-family:var(--font-display-face);font-size:13px;font-weight:900;color:#aaabab;}
.sd-project-meta h3{margin:0;font-family:var(--font-display-face);font-size:clamp(1.1rem,2.2vw,1.6rem);
  font-weight:900;text-transform:uppercase;letter-spacing:-.02em;}
.sd-project-meta p{margin:0;flex:1;font-size:14px;line-height:1.6;color:#aaabab;}
.sd-quotes{display:grid;gap:.75rem;}
@media(min-width:820px){.sd-quotes{grid-template-columns:repeat(3,1fr);}}
.sd-quote{margin:0;background:#f6f6f6;border-radius:24px;padding:1.8rem;}
.sd-quote blockquote{margin:0;font-size:15px;line-height:1.6;}
.sd-quote figcaption{margin-top:1.1rem;display:flex;flex-direction:column;gap:.1rem;font-size:12.5px;}
.sd-quote figcaption strong{font-weight:700;}
.sd-quote figcaption span{color:#aaabab;}
.sd-lets-talk .sd-h2{text-align:center;font-size:clamp(2.6rem,7vw,5rem);margin-bottom:2rem;}
`;

export const nudgeTemplate: SiteTemplateModule = {
  id: 'nudge',
  theme: nudgeTheme,
  render: ({ site }) => <NudgePage site={site} />,
};
