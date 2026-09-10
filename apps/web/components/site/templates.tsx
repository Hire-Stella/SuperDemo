/**
 * Landing-page templates.
 *
 * The layouts used to live in this file. They are now one file each under
 * `./templates/`, registered in `./templates/registry`, because adding a fifth
 * meant editing a switch here, an enum and a metadata record in contracts, and
 * remembering all three. See `./templates/types` for what a template is and how
 * to add one.
 *
 * This file stays as the entry point so callers keep importing one path.
 */
export { SiteRender, SITE_TEMPLATE_MODULES } from './templates/registry';
export type { SiteTemplateModule } from './templates/types';
