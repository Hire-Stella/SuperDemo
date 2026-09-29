import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  DOGRAH_WIDGET_DISABLED,
  type PublicSiteDto,
  SiteCorners,
  SiteDensity,
  SiteDisplay,
  SiteSurface,
  SiteTemplate,
  ThemePreset,
  monogramDataUri,
  resolveThemeTokens,
  siteStyleToCss,
  THEME_PRESETS,
  themeToCss,
} from '@superdemo/contracts';
import { TEMPLATES as LIBRARY } from '@stella/template-runtime';
import { TalkToStellaWidget as OscarTalkToStellaWidget } from '@stella/template-oscar';
import { SiteRender } from '@/components/site/templates';
import { DograhWidget } from '@/components/site/dograh-widget';

/**
 * A tenant's public landing page.
 *
 * Server-rendered, and both the theme and the style go out in the HTML rather
 * than being applied by an effect after hydration. That is the difference between
 * a client's page and the app shell: in the dashboard a brief flash of the
 * platform's red while the session loads is a blemish, but on a stranger's first
 * impression of a client's brand it is the whole problem — they would watch a red
 * page turn green.
 *
 * Fetched from the API rather than the database directly. The web app holds no
 * Prisma client and should not start now; the public endpoint already exists for
 * this and is the same thing an external caller would use.
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101';

/**
 * What the API actually sends, which is not always what this page was built
 * against. Web and API deploy independently — the container app trailed the
 * web app by eleven days once — so a field added on both sides still arrives
 * missing for as long as the older image is serving. Marking `dograh`
 * optional makes the compiler insist on the fallback instead of trusting a
 * cast, which is what put a stack trace in front of a client's visitors.
 */
type OnTheWire = Omit<PublicSiteDto, 'dograh'> & { dograh?: PublicSiteDto['dograh'] };

async function fetchSite(slug: string): Promise<PublicSiteDto | null> {
  try {
    const res = await fetch(`${API}/api/public/sites/${encodeURIComponent(slug)}`, {
      // No caching: an operator edits their page and reloads to check it, and a
      // stale render would read as the save having failed. Worth revisiting with
      // a tag-based revalidation once anyone has traffic.
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const wire = (await res.json()) as OnTheWire;
    // No agent connected is the honest reading of a missing field, and it is
    // the state every centre starts in anyway.
    return { ...wire, dograh: wire.dograh ?? DOGRAH_WIDGET_DISABLED };
  } catch {
    // The API being down must not render a stack trace at a client's visitors.
    return null;
  }
}

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };
type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Applies the editor's unsaved selections for rendering only.
 *
 * The Website page previews a page in an iframe, and a preview that showed the
 * *saved* version would be useless for choosing between treatments. So the
 * template, theme and the four style axes can be overridden by query parameter.
 *
 * Every one of them is parsed through its own zod enum and silently dropped if
 * it does not match, so the worst a hand-crafted URL can do is render the same
 * page in a different one of its own supported looks. Nothing is persisted, no
 * copy or contact detail is overridable, and there is no path here that injects
 * CSS — the values only ever index into maps defined in contracts.
 */
function applyPreview(site: PublicSiteDto, sp: SearchParams): { site: PublicSiteDto; previewing: boolean } {
  const one = (key: string): string | undefined => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const pick = <T,>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }, key: string): T | undefined => {
    const raw = one(key);
    if (!raw) return undefined;
    const parsed = schema.safeParse(raw);
    return parsed.success ? parsed.data : undefined;
  };

  const template = pick<SiteTemplate>(SiteTemplate, 'template');
  const themePreset = pick<ThemePreset>(ThemePreset, 'theme');
  const surface = pick<SiteSurface>(SiteSurface, 'surface');
  const display = pick<SiteDisplay>(SiteDisplay, 'display');
  const corners = pick<SiteCorners>(SiteCorners, 'corners');
  const density = pick<SiteDensity>(SiteDensity, 'density');

  const overrides = [template, themePreset, surface, display, corners, density];
  if (overrides.every((v) => v === undefined)) return { site, previewing: false };

  return {
    previewing: true,
    site: {
      ...site,
      template: template ?? site.template,
      // A previewed preset must also drop any pasted token export, or the export
      // would win and the preview would show no change at all.
      themePreset: themePreset ?? site.themePreset,
      themeTokens: themePreset ? null : site.themeTokens,
      style: {
        surface: surface ?? site.style.surface,
        display: display ?? site.style.display,
        corners: corners ?? site.style.corners,
        density: density ?? site.style.density,
      },
    },
  };
}

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const { slug } = await params;
  const site = await fetchSite(slug);
  if (!site) return { title: 'Not found' };

  const { previewing } = applyPreview(site, await searchParams);
  const title = site.metaTitle ?? [site.name, site.tagline].filter(Boolean).join(' · ');

  return {
    title: previewing ? `Preview · ${title}` : title,
    description: site.metaDescription ?? (site.content.hero.subhead || undefined),
    // A preview URL is a real, reachable page. Keeping it out of an index costs
    // nothing and stops a half-chosen treatment being what a search engine has
    // on file for a client.
    robots: previewing ? { index: false, follow: false } : undefined,
    // The monogram doubles as the favicon, so a centre with no logo still has a
    // recognisable tab. Baked colour rather than var(--primary): a favicon is
    // rendered outside the document and has no cascade to read from.
    icons: {
      icon: site.logoUrl ?? monogramDataUri(site.name, {
        background: THEME_PRESETS[site.themePreset].swatch,
        square: true,
      }),
    },
    openGraph: {
      title,
      description: site.metaDescription ?? (site.content.hero.subhead || undefined),
      siteName: site.name,
      type: 'website',
    },
  };
}

export default async function TenantSitePage({ params, searchParams }: Params) {
  const { slug } = await params;
  const fetched = await fetchSite(slug);
  if (!fetched) notFound();

  const { site, previewing } = applyPreview(fetched, await searchParams);

  const themeCss = themeToCss(resolveThemeTokens(site.themePreset, site.themeTokens));
  const styleCss = siteStyleToCss(site.style);

  /**
   * The chat launcher's skin, keyed off the ported template's own manifest.
   *
   * Set at `:root` rather than on the template's `.{id}-root` div: the
   * launcher renders as this page's sibling, not the template's descendant,
   * so a scoped variable would never reach it. In-house templates (solaris,
   * sentira, …) declare no manifest here and the launcher keeps its current
   * generic look, unchanged.
   */
  const widgetTheme = LIBRARY[site.template]?.manifest.widgetTheme;
  const widgetThemeCss = widgetTheme
    ? `:root{${(
        [
          ['--widget-accent', widgetTheme.accent],
          ['--widget-on-accent', widgetTheme.onAccent],
          ['--widget-radius', widgetTheme.radius],
          ['--widget-font', widgetTheme.font],
          ['--widget-transition', widgetTheme.transition],
        ] as const
      )
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}:${v};`)
        .join('')}}`
    : '';

  return (
    <>
      {/*
        Injected after globals.css, so these overrides win on document order —
        the same mechanism TenantTheme uses in the app, minus the round trip
        through the client. Theme first, then style: the surface tokens are
        derived from `--primary`, so they have to resolve against the palette
        this centre actually ends up with.
      */}
      {themeCss && <style dangerouslySetInnerHTML={{ __html: themeCss }} />}
      <style dangerouslySetInnerHTML={{ __html: styleCss }} />
      {widgetThemeCss && <style dangerouslySetInnerHTML={{ __html: widgetThemeCss }} />}
      <SiteRender site={site} />
      {/*
        Decided here, not in the widget: the prop is serialised into the flight
        payload, so anything passed is public. Preview renders nothing at all.

        oscar carries its own hand-built launcher (see
        packages/templates/oscar/src/talk-to-stella.tsx for why it isn't the
        generic DograhWidget below), so it gets the connection's raw tokens
        instead — the chat token has to be pulled out of chatScriptSrc's own
        query string since DograhWidgetDto only carries the built URL, not the
        bare token, for every other template's benefit.
      */}
      {site.template === 'oscar' && !previewing && site.dograh.enabled && site.dograh.baseUrl && site.dograh.embedToken ? (
        <OscarTalkToStellaWidget
          baseUrl={site.dograh.baseUrl}
          voiceToken={site.dograh.embedToken}
          chatToken={
            (site.dograh.chatScriptSrc && new URL(site.dograh.chatScriptSrc).searchParams.get('token')) ||
            site.dograh.embedToken
          }
          chatContainerId={site.dograh.chatContainerId}
        />
      ) : (
        <DograhWidget
          src={previewing || !site.dograh.enabled ? null : site.dograh.scriptSrc}
          chatSrc={previewing || !site.dograh.enabled ? null : site.dograh.chatScriptSrc}
          chatContainerId={site.dograh.chatContainerId}
        />
      )}
    </>
  );
}
