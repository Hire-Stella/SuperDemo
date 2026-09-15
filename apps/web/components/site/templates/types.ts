import type { ReactNode } from 'react';
import type { SiteTemplate } from '@superdemo/contracts';
import type { Site } from '@/components/site/parts';

/**
 * What a landing-page template is.
 *
 * ## Adding one
 *
 * Two edits, and the compiler will tell you if you only make one:
 *
 *  1. Add its id to `SiteTemplate` and an entry to `SITE_TEMPLATES` in
 *     `packages/contracts/src/sites.ts`. That id is a database value and an
 *     API-validated field, which is why it lives in contracts rather than here
 *     — the API and the editor need the label without importing React.
 *  2. Add `templates/<id>.tsx` exporting a `SiteTemplateModule`, and list it in
 *     `templates/registry.tsx`.
 *
 * `SITE_TEMPLATE_MODULES` is typed `Record<SiteTemplate, SiteTemplateModule>`,
 * so step 1 without step 2 fails to compile rather than falling back to Classic
 * at runtime in front of a client. That is the whole reason this file exists.
 *
 * ## What a template decides
 *
 * The hero's composition, how much of the page the hero band covers, and which
 * variant of each section suits it.
 *
 * ## What it must not decide
 *
 *  * **Colour.** Read the `--site-hero-*` custom properties that
 *    `siteStyleToCss` emits. Never a literal. The first version of `bold` baked
 *    in a near-black, which meant one layout in four ignored the tenant's brand
 *    entirely — the tokens exist to make that impossible.
 *  * **Section order.** `content.sections` belongs to the tenant; map over it
 *    with `Sections` from `./shared` rather than hardcoding a sequence.
 *  * **Which sections exist.** Compose the shared parts. A template that
 *    invents its own "services" block is a template that will look subtly
 *    unlike the other four.
 */
export interface SiteTemplateModule {
  /** Must equal the key it is registered under, and a `SiteTemplate` id. */
  id: SiteTemplate;
  render: (props: { site: Site }) => ReactNode;
  /**
   * The template's own design: tokens plus scoped CSS.
   *
   * Every template here is a port of a published page, so each owns both its
   * design *and* its arrangement — its own hero composition, its own section
   * order, its own grids. There was briefly a shared `StandardPage` that all of
   * them rendered, and it was a mistake: it made every template the same page
   * in different colours, which is a re-skin and not a port.
   *
   * So `render` is expected to be bespoke per template, and this field carries
   * the tokens the shared section components (Faq, Contact, SiteFooter) read.
   * Emitted before the layout, so it beats both the tenant theme and
   * `siteStyleToCss` on document order. Set tokens and `.sd-*` rules; do not
   * reach into the shared components.
   */
  theme?: string;
}
