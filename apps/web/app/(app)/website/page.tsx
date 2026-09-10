'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Inbox,
  Monitor,
  PhoneOutgoing,
  RefreshCw,
  Save,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import {
  SITE_CORNERS_LABELS,
  SITE_DENSITY_LABELS,
  SITE_DISPLAY_LABELS,
  SITE_LOOKS,
  SITE_SECTION_LABELS,
  SITE_SURFACE_LABELS,
  SITE_TEMPLATES,
  THEME_PRESETS,
  ThemePreset as ThemePresetEnum,
  type CampaignSummary,
  type SiteContent,
  type SiteCorners,
  type SiteDensity,
  type SiteDisplay,
  type SiteDto,
  type SiteLeadRow,
  type SiteSection,
  type SiteStyle,
  type SiteSurface,
  type SiteTemplate,
  type ThemePreset,
} from '@superdemo/contracts';
import { api } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { useSession } from '@/components/providers';
import { TenantLogo } from '@/components/tenant-logo';
import { DograhConnection } from '@/components/dograh-connection';
import { WebsiteGenerator } from '@/components/website-generator';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  Select,
  SkeletonRows,
  Spinner,
  Table,
  Td,
  Textarea,
  Th,
  cn,
} from '@/components/composites';

/**
 * The centre's landing page, edited from inside the platform.
 *
 * Form fields and section toggles rather than a drag-and-drop canvas. That is a
 * deliberate limit: reordering and hiding sections is most of what a builder is
 * actually used for, and it costs a fraction of one — no block library, no media
 * pipeline, no revision history. The escape hatch for a client who wants
 * something a template cannot express is their real website; this page exists so
 * that a centre created five minutes ago has somewhere to send a caller.
 */
export default function WebsitePage() {
  const queryClient = useQueryClient();
  const { refreshSession } = useSession();

  const site = useQuery({ queryKey: ['site'], queryFn: () => api.get<SiteDto>('/sites/mine') });
  const leads = useQuery({
    queryKey: ['site-leads'],
    queryFn: () => api.get<SiteLeadRow[]>('/sites/mine/leads?limit=25'),
  });
  const campaigns = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get<CampaignSummary[]>('/campaigns'),
  });

  /**
   * The whole page is one draft, saved explicitly.
   *
   * Autosave on a public-facing page is the wrong default: a half-typed headline
   * would be live to visitors between keystrokes.
   */
  const [draft, setDraft] = useState<SiteDto | null>(null);
  useEffect(() => {
    if (site.data && !draft) setDraft(site.data);
  }, [site.data, draft]);

  const [viewport, setViewport] = useState<'desktop' | 'phone'>('desktop');
  /** Bumped to remount the iframe; a src that has not changed will not reload. */
  const [previewNonce, setPreviewNonce] = useState(0);

  const save = useMutation({
    mutationFn: (body: Partial<SiteDto>) =>
      api.put<SiteDto>('/sites/mine', {
        template: body.template,
        isPublished: body.isPublished,
        content: body.content,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        leadCampaignId: body.leadCampaignId,
        logoUrl: body.logoUrl ?? null,
        tagline: body.tagline ?? null,
        style: body.style,
        themePreset: body.themePreset,
      }),
    onSuccess: async (fresh) => {
      setDraft(fresh);
      queryClient.setQueryData(['site'], fresh);
      // The shell reads the mark, the name and the palette from the session, so
      // without this the sidebar keeps the old brand until the access token
      // happens to refresh — which looks exactly like the save not having taken.
      await refreshSession();
      toast.success('Saved — your page and your dashboard both follow');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const dirty = useMemo(
    () => Boolean(draft && site.data && JSON.stringify(draft) !== JSON.stringify(site.data)),
    [draft, site.data],
  );

  if (site.isLoading || !draft) return <Spinner label="Loading your page…" />;

  const publicUrl = `/${draft.slug}`;

  /* Helpers that keep the nested content updates readable. */
  const patch = (next: Partial<SiteDto>) => setDraft({ ...draft, ...next });
  const patchContent = (next: Partial<SiteContent>) =>
    setDraft({ ...draft, content: { ...draft.content, ...next } });

  const moveSection = (index: number, by: -1 | 1) => {
    const order = [...draft.content.sections];
    const to = index + by;
    if (to < 0 || to >= order.length) return;
    [order[index], order[to]] = [order[to]!, order[index]!];
    patchContent({ sections: order });
  };

  const toggleSection = (key: SiteSection) => {
    const order = draft.content.sections.includes(key)
      ? draft.content.sections.filter((k) => k !== key)
      : [...draft.content.sections, key];
    patchContent({ sections: order });
  };

  const allSections = Object.keys(SITE_SECTION_LABELS) as SiteSection[];
  const hidden = allSections.filter((k) => !draft.content.sections.includes(k));

  /* ------------------------------- preview -------------------------------- */

  // Only the axes travel in the URL — see the note beside the iframe.
  const previewUrl =
    `/${draft.slug}?` +
    new URLSearchParams({
      template: draft.template,
      theme: draft.themePreset,
      surface: draft.style.surface,
      display: draft.style.display,
      corners: draft.style.corners,
      density: draft.style.density,
    }).toString();

  // Rendered at a real width and scaled down, so the preview shows the actual
  // responsive breakpoint rather than a narrow column pretending to be a page.
  const frameWidth = viewport === 'desktop' ? 1280 : 400;
  const previewScale = viewport === 'desktop' ? 0.33 : 0.72;

  const variationCount =
    Object.keys(SITE_TEMPLATES).length *
    ThemePresetEnum.options.length *
    Object.keys(SITE_SURFACE_LABELS).length *
    Object.keys(SITE_DISPLAY_LABELS).length *
    Object.keys(SITE_CORNERS_LABELS).length *
    Object.keys(SITE_DENSITY_LABELS).length;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Globe className="size-5 text-primary" aria-hidden /> Website
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your public page. The call button rings your number and the form drops a contact into
            this centre.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm transition hover:bg-accent"
          >
            <ExternalLink className="size-3.5" aria-hidden /> View page
          </a>
          <Button disabled={!dirty} loading={save.isPending} onClick={() => save.mutate(draft)}>
            <Save className="size-3.5" aria-hidden />
            {dirty ? 'Save changes' : 'Saved'}
          </Button>
        </div>
      </header>

      {/* ------------------------------ status ------------------------------ */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-4 p-4">
          <TenantLogo name={draft.name} logoUrl={draft.logoUrl} size={44} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-semibold">
              {draft.name}
              {draft.isPublished ? (
                <Badge className="bg-live-soft text-live" dot="bg-live">
                  live
                </Badge>
              ) : (
                <Badge className="bg-warn-soft text-warn">draft — not reachable</Badge>
              )}
            </p>
            <p className="tnum mt-0.5 truncate text-xs text-muted-foreground">
              {publicUrl}
              {draft.phoneE164 && <> · calls go to {draft.phoneE164}</>}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => patch({ isPublished: !draft.isPublished })}
          >
            {draft.isPublished ? (
              <>
                <EyeOff className="size-3.5" aria-hidden /> Unpublish
              </>
            ) : (
              <>
                <Eye className="size-3.5" aria-hidden /> Publish
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* ------------------------------- looks ----------------------------- */}
      <Card
        className="mb-4"
        title="Template"
        subtitle="Pick a finished design. Everything on the page is filled from your website — there is nothing else to set."
      >
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {(Object.keys(SITE_TEMPLATES) as SiteTemplate[]).map((key) => {
            const t = SITE_TEMPLATES[key];
            const active = draft.template === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => patch({ template: key })}
                aria-pressed={active}
                className={cn(
                  'group overflow-hidden rounded-xl border text-left transition',
                  active
                    ? 'border-primary ring-2 ring-primary/25'
                    : 'border-border hover:border-primary/40',
                )}
              >
                {/*
                  A live thumbnail of the real page in that template, not a
                  hand-drawn sketch. The old picker had SVG mock-ups that were
                  wrong the moment a template changed — and with the layouts
                  gone the difference between these is entirely the design, so
                  a sketch could not show it at all.
                */}
                <span className="block h-36 overflow-hidden bg-muted">
                  <iframe
                    src={`/${draft.slug}?template=${key}`}
                    title={`${t.label} preview`}
                    aria-hidden
                    tabIndex={-1}
                    scrolling="no"
                    className="pointer-events-none h-[520px] w-[1280px] origin-top-left border-0"
                    style={{ transform: 'scale(0.28)' }}
                  />
                </span>
                <span className="block border-t border-border p-3">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {t.label}
                    {active && <Badge dot="bg-live">In use</Badge>}
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                    {t.note}
                  </span>
                  <span className="mt-1.5 block text-[11px] leading-relaxed text-muted-foreground/80">
                    {t.bestFor}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
        <div className="space-y-4">
          {/* --------------------------- layout --------------------------- */}
          {/*
            The layout picker is gone: there is one template now, a ported
            design that is already finished. Treatment (surface, face, corners,
            density) is still a choice, because those re-dress one layout
            rather than asking somebody to pick between four.
          */}
          <></>

          {/* -------------------------- treatment -------------------------- */}
          <></>{/* Treatment card removed — filled from the scrape */}

          {/* --------------------------- identity -------------------------- */}
          <></>{/* Brand card removed — filled from the scrape */}
        </div>

        {/* ---------------------------- preview --------------------------- */}
        <Card
          className="xl:sticky xl:top-4 xl:self-start"
          title="Preview"
          subtitle="Your real page, rendered with the selections above"
          action={
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                className={cn(
                  'rounded p-1.5 transition',
                  viewport === 'desktop'
                    ? 'bg-brand-soft text-primary'
                    : 'text-muted-foreground hover:bg-muted',
                )}
                aria-label="Desktop width"
              >
                <Monitor className="size-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setViewport('phone')}
                className={cn(
                  'rounded p-1.5 transition',
                  viewport === 'phone'
                    ? 'bg-brand-soft text-primary'
                    : 'text-muted-foreground hover:bg-muted',
                )}
                aria-label="Phone width"
              >
                <Smartphone className="size-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setPreviewNonce((n) => n + 1)}
                className="rounded p-1.5 text-muted-foreground transition hover:bg-muted"
                aria-label="Reload the preview"
                title="Reload — needed after editing copy, which is not in the preview URL"
              >
                <RefreshCw className="size-3.5" aria-hidden />
              </button>
            </div>
          }
        >
          <div className="overflow-hidden bg-muted/40 p-3">
            {/*
              The real page in an iframe, not a mock.

              Layout, palette and treatment travel as query parameters the public
              route validates against its own enums, so this is the same code a
              visitor gets rather than a second implementation that would drift.
              Copy is deliberately *not* in the URL — it would reload the frame on
              every keystroke — so text edits appear after Save and a reload.
            */}
            <div
              className="mx-auto overflow-hidden rounded-lg border border-border bg-background"
              style={{ width: frameWidth * previewScale, height: 560 }}
            >
              <iframe
                key={previewNonce}
                src={previewUrl}
                title="Landing page preview"
                className="origin-top-left border-0"
                style={{
                  width: frameWidth,
                  height: 560 / previewScale,
                  transform: `scale(${previewScale})`,
                }}
              />
            </div>
          </div>
          <p className="border-t border-border px-4 py-2 text-[11px] leading-relaxed text-muted-foreground">
            Treatment changes show immediately. Text changes need a save, then the reload button.
          </p>
        </Card>
      </div>

      {/* ------------------------------- hero ------------------------------ */}
      <></>{/* Hero copy card removed — filled from the scrape */}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {/* ---------------------------- sections -------------------------- */}
        <></>{/* Section order card removed — filled from the scrape */}

        {/* ---------------------------- contact --------------------------- */}
        <></>{/* Contact details card removed — filled from the scrape */}
      </div>

      {/* --------------------------- lead routing -------------------------- */}
      <Card
        className="mt-4"
        title={
          <span className="flex items-center gap-1.5">
            <PhoneOutgoing className="size-4" aria-hidden /> What happens to a request
          </span>
        }
        subtitle="A captured number can sit in your contacts, or go straight into the dialler"
      >
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
          <div>
            <Label htmlFor="lead-campaign">Add to campaign</Label>
            <Select
              id="lead-campaign"
              value={draft.leadCampaignId ?? ''}
              onChange={(e) => patch({ leadCampaignId: e.target.value || null })}
              className="mt-1.5"
            >
              <option value="">Capture only — a person calls them back</option>
              {campaigns.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.status.toLowerCase()})
                </option>
              ))}
            </Select>
          </div>
          <p className="rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            {draft.leadCampaignId ? (
              <>
                A request becomes a contact and a target on that campaign. The dialler only picks it
                up while the campaign is <strong>running</strong> and inside its calling window —
                otherwise the lead is captured and waits, because telling a visitor “we will call you
                shortly” and then queueing them behind a paused campaign is worse than not promising.
                Anyone who has previously asked not to be called is never queued.
              </>
            ) : (
              <>
                A request becomes a contact in this centre and appears below. Nobody is dialled
                automatically — pick a campaign above if you want the dialler to ring them.
              </>
            )}
          </p>
        </div>
      </Card>

      {/* ------------------- generated from their website ------------------ */}
      <WebsiteGenerator />

      {/* ---------------------------- voice agent -------------------------- */}
      <DograhConnection />

      {/* ------------------------------- leads ----------------------------- */}
      <Card
        className="mt-4"
        title={
          <span className="flex items-center gap-1.5">
            <Inbox className="size-4" aria-hidden /> Callback requests
          </span>
        }
        subtitle={`${draft.leadCount} received in total`}
      >
        {leads.isLoading ? (
          <SkeletonRows rows={4} cols={5} />
        ) : leads.data && leads.data.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Number</Th>
                <Th>Message</Th>
                <Th>Routed</Th>
                <Th className="text-right">When</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.data.map((l) => (
                <tr key={l.id}>
                  <Td className="text-sm font-medium">{l.name}</Td>
                  <Td className="tnum text-xs">{l.phoneE164}</Td>
                  <Td className="max-w-[24rem]">
                    <span className="block truncate text-xs text-muted-foreground">
                      {l.message ?? '—'}
                    </span>
                  </Td>
                  <Td>
                    {l.queuedToCampaign ? (
                      <Badge className="bg-live-soft text-live">queued to dialler</Badge>
                    ) : (
                      <Badge>captured</Badge>
                    )}
                  </Td>
                  <Td className="text-right text-xs whitespace-nowrap text-muted-foreground">
                    {dateTime(l.createdAt)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            icon={<Inbox className="size-8" aria-hidden />}
            title="No requests yet"
            hint="Anyone who fills in the form on your page appears here, and becomes a contact in this centre."
          />
        )}
      </Card>
    </div>
  );
}

/**
 * A segmented control for one style axis.
 *
 * Segmented rather than a `<select>`: there are three or four options, the whole
 * point is comparing them, and a dropdown hides two of the three while you are
 * deciding.
 */
function Axis<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { key: T; label: string; note?: string }[];
  onChange: (value: T) => void;
}) {
  const current = options.find((o) => o.key === value);
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            aria-pressed={o.key === value}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
              o.key === value
                ? 'border-primary bg-brand-soft text-primary'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {current?.note && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{current.note}</p>
      )}
    </div>
  );
}

/**
 * A dot showing what a look's surface does to the current palette.
 *
 * Built with the same `color-mix` expressions as `SURFACE_TOKENS`, so the swatch
 * cannot claim a colour the page will not actually render. Its input is the
 * *draft's* theme, which is why picking a new palette updates every look's dot.
 */
function LookSwatch({ look, theme }: { look: SiteSurface; theme: ThemePreset }) {
  const primary = THEME_PRESETS[theme].swatch;
  const background = {
    plain: `color-mix(in oklch, ${primary} 6%, white)`,
    tint: `color-mix(in oklch, ${primary} 18%, white)`,
    ink: `color-mix(in oklch, ${primary} 15%, oklch(0.17 0.014 265))`,
    brand: primary,
  }[look];

  return (
    <span
      aria-hidden
      className="size-4 shrink-0 rounded-full border border-border"
      style={{ background }}
    />
  );
}

