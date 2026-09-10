import type { SiteTemplate } from '@superdemo/contracts';
import type { Site } from '@/components/site/parts';
import type { SiteTemplateModule } from './types';
import { solarisTemplate } from './solaris';
import { sentiraTemplate } from './sentira';
import { knotchTemplate } from './knotch';
import { nudgeTemplate } from './nudge';

/**
 * Every landing template, by id. Currently one.
 *
 * `Record<SiteTemplate, …>` is deliberate and load-bearing: adding an id to
 * the contract without adding a module here is a type error, not a silent
 * fallback on a client's live page. See `./types` for the two-step.
 */
export const SITE_TEMPLATE_MODULES: Record<SiteTemplate, SiteTemplateModule> = {
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
