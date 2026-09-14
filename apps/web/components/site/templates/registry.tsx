import type { SiteTemplate } from '@superdemo/contracts';
import { TEMPLATES as LIBRARY } from '@stella/template-runtime';
import type { Site } from '@/components/site/parts';
import { toTemplateContent } from '@/components/site/library-adapter';
import type { SiteTemplateModule } from './types';
import { solarisTemplate } from './solaris';
import { sentiraTemplate } from './sentira';
import { knotchTemplate } from './knotch';
import { nudgeTemplate } from './nudge';

/**
 * The in-house templates, by id.
 *
 * No longer `Record<SiteTemplate, …>`: most ids now resolve in the ported
 * library instead, and requiring an in-house module for each would mean
 * writing four dead entries per ported design. `SiteRender` checks both and
 * the contract's enum is still the closed set either way.
 */
export const SITE_TEMPLATE_MODULES: Partial<Record<SiteTemplate, SiteTemplateModule>> = {
  solaris: solarisTemplate,
  sentira: sentiraTemplate,
  knotch: knotchTemplate,
  nudge: nudgeTemplate,
};

/**
 * Render a centre's page.
 *
 * The stored id is still looked up rather than assumed, so a row written by a
 * future version — or an older one naming a template since removed — serves a
 * page instead of a 500 on someone's marketing site.
 */
export function SiteRender({ site }: { site: Site }) {
  /*
   * Ported templates first.
   *
   * They own their whole page — their own layout, palette, fonts and section
   * order — so there is nothing of ours to wrap them in. The content is
   * converted at the seam rather than inside the library, because the library
   * also serves ai-employees-v2 and must not learn what a SuperDemo Site is.
   */
  const ported = LIBRARY[site.template];
  if (ported) return <>{ported.render({ content: toTemplateContent(site) })}</>;

  const template = SITE_TEMPLATE_MODULES[site.template] ?? solarisTemplate;
  return (
    <>
      {/*
        The template's own design, emitted after the tenant theme and after
        siteStyleToCss so it wins on document order.
      */}
      {template.theme && <style dangerouslySetInnerHTML={{ __html: template.theme }} />}
      {template.render({ site })}
    </>
  );
}
