import type { TemplateContent, TemplateManifest } from '@stella/template-schema';
import { SanveraTemplate, manifest as sanveraManifest } from '@stella/template-sanvera';
import { Template as MomentumTemplate, manifest as momentumManifest } from '@stella/template-momentum';
import { Template as ReodentalTemplate, manifest as reodentalManifest } from '@stella/template-reodental';
import { Template as TripvantaTemplate, manifest as tripvantaManifest } from '@stella/template-tripvanta';
import { Template as ElianvalenTemplate, manifest as elianvalenManifest } from '@stella/template-elianvalen';
import { Template as RescaleTemplate, manifest as rescaleManifest } from '@stella/template-rescale';
import { Template as StackgridTemplate, manifest as stackgridManifest } from '@stella/template-stackgrid';
import { Template as UtomicTemplate, manifest as utomicManifest } from '@stella/template-utomic';
import { Template as ZovaTemplate, manifest as zovaManifest } from '@stella/template-zova';

/**
 * Every template, by id.
 *
 * `Record<string, …>` rather than a union today because templates land one at
 * a time and a half-added one should be a missing key, not a compile error
 * across both products. Once the set is stable this tightens to a union and
 * the registry becomes exhaustive, which is the check worth having then.
 */
export interface TemplateEntry {
  manifest: TemplateManifest;
  render: (props: { content: TemplateContent }) => React.ReactNode;
  /** Imported by the host app's stylesheet — templates own their own palette. */
  themeHref: string;
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  sanvera: { manifest: sanveraManifest, render: SanveraTemplate, themeHref: '@stella/template-sanvera/theme.css' },
  momentum: { manifest: momentumManifest, render: MomentumTemplate, themeHref: '@stella/template-momentum/theme.css' },
  reodental: { manifest: reodentalManifest, render: ReodentalTemplate, themeHref: '@stella/template-reodental/theme.css' },
  tripvanta: { manifest: tripvantaManifest, render: TripvantaTemplate, themeHref: '@stella/template-tripvanta/theme.css' },
  elianvalen: { manifest: elianvalenManifest, render: ElianvalenTemplate, themeHref: '@stella/template-elianvalen/theme.css' },
  rescale: { manifest: rescaleManifest, render: RescaleTemplate, themeHref: '@stella/template-rescale/theme.css' },
  stackgrid: { manifest: stackgridManifest, render: StackgridTemplate, themeHref: '@stella/template-stackgrid/theme.css' },
  utomic: { manifest: utomicManifest, render: UtomicTemplate, themeHref: '@stella/template-utomic/theme.css' },
  zova: { manifest: zovaManifest, render: ZovaTemplate, themeHref: '@stella/template-zova/theme.css' },
};

export const TEMPLATE_IDS = Object.keys(TEMPLATES);

export const TEMPLATE_LIST: TemplateManifest[] = Object.values(TEMPLATES).map((t) => t.manifest);

/**
 * Render a template by id.
 *
 * An unknown id renders `fallback` rather than throwing. These pages are
 * public and a tenant's marketing site must not 500 because a row names a
 * template that was renamed or removed — the same reasoning as SuperDemo's own
 * registry, learned when four layouts were deleted under fifteen live rows.
 */
export function TemplateRenderer({
  id,
  content,
  fallback = 'sanvera',
}: {
  id: string;
  content: TemplateContent;
  fallback?: string;
}) {
  const entry = TEMPLATES[id] ?? TEMPLATES[fallback];
  if (!entry) return null;
  return entry.render({ content });
}

/** Templates that can show everything this content has. */
export function templatesFor(content: TemplateContent): TemplateManifest[] {
  const wanted = content.sections;
  if (wanted.length === 0) return TEMPLATE_LIST;
  return TEMPLATE_LIST.filter((m) => wanted.every((s) => m.supports.includes(s)));
}

export type { TemplateContent, TemplateManifest };
