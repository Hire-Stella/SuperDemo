import type { TemplateContent, TemplateManifest } from '@stella/template-schema';
import { SanveraTemplate, manifest as sanveraManifest } from '@stella/template-sanvera';
import {
  Template as MomentumTemplate,
  manifest as momentumManifest,
} from '@stella/template-momentum';
import {
  Template as ReodentalTemplate,
  manifest as reodentalManifest,
} from '@stella/template-reodental';
import {
  Template as TripvantaTemplate,
  manifest as tripvantaManifest,
} from '@stella/template-tripvanta';
import {
  Template as ElianvalenTemplate,
  manifest as elianvalenManifest,
} from '@stella/template-elianvalen';
import { Template as RescaleTemplate, manifest as rescaleManifest } from '@stella/template-rescale';
import {
  Template as StackgridTemplate,
  manifest as stackgridManifest,
} from '@stella/template-stackgrid';
import { Template as UtomicTemplate, manifest as utomicManifest } from '@stella/template-utomic';
import { Template as ZovaTemplate, manifest as zovaManifest } from '@stella/template-zova';
import { Template as TavolaTemplate, manifest as tavolaManifest } from '@stella/template-tavola';
import { Template as FornoTemplate, manifest as fornoManifest } from '@stella/template-forno';
import { Template as AureliaTemplate, manifest as aureliaManifest } from '@stella/template-aurelia';
import { Template as BrasaTemplate, manifest as brasaManifest } from '@stella/template-brasa';
import { Template as YokaiTemplate, manifest as yokaiManifest } from '@stella/template-yokai';
import { Template as NatsuTemplate, manifest as natsuManifest } from '@stella/template-natsu';
import { Template as KilnTemplate, manifest as kilnManifest } from '@stella/template-kiln';
import { Template as FolioTemplate, manifest as folioManifest } from '@stella/template-folio';
import { Template as PearlTemplate, manifest as pearlManifest } from '@stella/template-pearl';
import { Template as SucreTemplate, manifest as sucreManifest } from '@stella/template-sucre';
import { Template as OscarTemplate, manifest as oscarManifest } from '@stella/template-oscar';
import { Template as CryptixTemplate, manifest as cryptixManifest } from '@stella/template-cryptix';
import { Template as FluxoTemplate, manifest as fluxoManifest } from '@stella/template-fluxo';
import { Template as InsunetTemplate, manifest as insunetManifest } from '@stella/template-insunet';
import { Template as SummitTemplate, manifest as summitManifest } from '@stella/template-summit';
import { Template as VantraTemplate, manifest as vantraManifest } from '@stella/template-vantra';

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
  sanvera: {
    manifest: sanveraManifest,
    render: SanveraTemplate,
    themeHref: '@stella/template-sanvera/theme.css',
  },
  momentum: {
    manifest: momentumManifest,
    render: MomentumTemplate,
    themeHref: '@stella/template-momentum/theme.css',
  },
  reodental: {
    manifest: reodentalManifest,
    render: ReodentalTemplate,
    themeHref: '@stella/template-reodental/theme.css',
  },
  tripvanta: {
    manifest: tripvantaManifest,
    render: TripvantaTemplate,
    themeHref: '@stella/template-tripvanta/theme.css',
  },
  elianvalen: {
    manifest: elianvalenManifest,
    render: ElianvalenTemplate,
    themeHref: '@stella/template-elianvalen/theme.css',
  },
  rescale: {
    manifest: rescaleManifest,
    render: RescaleTemplate,
    themeHref: '@stella/template-rescale/theme.css',
  },
  stackgrid: {
    manifest: stackgridManifest,
    render: StackgridTemplate,
    themeHref: '@stella/template-stackgrid/theme.css',
  },
  utomic: {
    manifest: utomicManifest,
    render: UtomicTemplate,
    themeHref: '@stella/template-utomic/theme.css',
  },
  zova: {
    manifest: zovaManifest,
    render: ZovaTemplate,
    themeHref: '@stella/template-zova/theme.css',
  },
  tavola: {
    manifest: tavolaManifest,
    render: TavolaTemplate,
    themeHref: '@stella/template-tavola/theme.css',
  },
  forno: {
    manifest: fornoManifest,
    render: FornoTemplate,
    themeHref: '@stella/template-forno/theme.css',
  },
  aurelia: {
    manifest: aureliaManifest,
    render: AureliaTemplate,
    themeHref: '@stella/template-aurelia/theme.css',
  },
  brasa: {
    manifest: brasaManifest,
    render: BrasaTemplate,
    themeHref: '@stella/template-brasa/theme.css',
  },
  yokai: {
    manifest: yokaiManifest,
    render: YokaiTemplate,
    themeHref: '@stella/template-yokai/theme.css',
  },
  natsu: {
    manifest: natsuManifest,
    render: NatsuTemplate,
    themeHref: '@stella/template-natsu/theme.css',
  },
  kiln: {
    manifest: kilnManifest,
    render: KilnTemplate,
    themeHref: '@stella/template-kiln/theme.css',
  },
  folio: {
    manifest: folioManifest,
    render: FolioTemplate,
    themeHref: '@stella/template-folio/theme.css',
  },
  pearl: {
    manifest: pearlManifest,
    render: PearlTemplate,
    themeHref: '@stella/template-pearl/theme.css',
  },
  sucre: {
    manifest: sucreManifest,
    render: SucreTemplate,
    themeHref: '@stella/template-sucre/theme.css',
  },
  oscar: {
    manifest: oscarManifest,
    render: OscarTemplate,
    themeHref: '@stella/template-oscar/theme.css',
  },
  cryptix: {
    manifest: cryptixManifest,
    render: CryptixTemplate,
    themeHref: '@stella/template-cryptix/theme.css',
  },
  fluxo: {
    manifest: fluxoManifest,
    render: FluxoTemplate,
    themeHref: '@stella/template-fluxo/theme.css',
  },
  insunet: {
    manifest: insunetManifest,
    render: InsunetTemplate,
    themeHref: '@stella/template-insunet/theme.css',
  },
  summit: {
    manifest: summitManifest,
    render: SummitTemplate,
    themeHref: '@stella/template-summit/theme.css',
  },
  vantra: {
    manifest: vantraManifest,
    render: VantraTemplate,
    themeHref: '@stella/template-vantra/theme.css',
  },
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
