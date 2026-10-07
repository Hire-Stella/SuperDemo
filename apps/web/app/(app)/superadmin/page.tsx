'use client';

import { Fragment, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ChevronDown,
  ExternalLink,
  Eye,
  Globe,
  Info,
  Mic,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  DEFAULT_PRESET_FOR_INDUSTRY,
  DEMO_DIALER_KINDS,
  DEMO_DIALER_LABELS,
  type DemoDialerKind,
  INDUSTRY_LABELS,
  INDUSTRY_TEMPLATES,
  Industry as IndustryEnum,
  SITE_TEMPLATES,
  SiteTemplate as SiteTemplateEnum,
  THEME_PRESETS,
  ThemePreset as ThemePresetEnum,
  defaultTemplateForIndustry,
  type SiteTemplate,
  type ThemePreset,
  type CreateOrgInput,
  type Industry,
  type Location,
  type OrgSummary,
} from '@superdemo/contracts';
import { api } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { useSession } from '@/components/providers';
import { TenantLogo } from '@/components/tenant-logo';
import { DograhConnection } from '@/components/dograh-connection';
import { PlatformDialers } from '@/components/platform-dialers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Badge,
  Button,
  Card,
  Input,
  Metric,
  Select,
  SkeletonRows,
  Table,
  Td,
  Th,
} from '@/components/composites';

/** "Northside Dental Clinic" → "northside-dental-clinic", mirroring the API. */
const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

const BLANK_ADMIN = { name: '', email: '', password: '', location: 'DUBAI' as Location };

/**
 * The platform operator's only page.
 *
 * Everything an operator can do lives here — create a centre, hand it an admin,
 * suspend it, or step into it read-only. There is no second screen on purpose:
 * running the platform is a different job from running a contact centre, and
 * the roles that do the latter have the rest of the app.
 */
export default function SuperadminPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { viewOrg } = useSession();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [timezone, setTimezone] = useState('Asia/Dubai');
  const [industry, setIndustry] = useState<Industry>('GENERIC');
  // Null means "follow the vertical" — the API picks, so an operator who does
  // not care about branding still gets something coherent.
  const [themePreset, setThemePreset] = useState<ThemePreset | null>(null);
  /* Identity and landing page. Both null-means-derive, like themePreset. */
  const [logoUrl, setLogoUrl] = useState('');
  const [tagline, setTagline] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  /*
   * Whether this centre gets a landing page at all. On by default because the
   * page is the fastest way to show the whole loop working, and off is a real
   * answer: plenty of clients already have a website and are buying the
   * contact centre.
   */
  const [websiteEnabled, setWebsiteEnabled] = useState(true);
  /*
   * Which landing design the centre starts on.
   *
   * Null means "whatever suits the vertical" — the API picks, so an operator
   * who does not care still gets something coherent. The picker came back when
   * the ported library arrived: choosing between four in-house layouts that
   * all looked in-house was a decision with no good answer, and choosing
   * between nine finished designs is a real one.
   */
  const [siteTemplate, setSiteTemplate] = useState<SiteTemplate | null>(null);
  /*
   * Whether this centre keeps the call simulator. On by default — it is the
   * fastest way to prove routing works on a centre thirty seconds old — and off
   * for a client already taking real calls, to whom a button that invents one
   * is a support ticket waiting to happen.
   */
  const [simulatorEnabled, setSimulatorEnabled] = useState(true);
  /*
   * Whether this centre gets the Demo calls page. On by default, same as the
   * other two. This only decides whether the page and its endpoints exist.
   * With a website URL, all three agents are built from it in the background;
   * without one, they are picked after creation in the voice panel, because
   * that picker lists every workflow on the voice host and there is no centre
   * yet for this form to scope that list to.
   */
  const [demoCallsEnabled, setDemoCallsEnabled] = useState(true);
  /* Which of the three slots: built from the URL, and offered on the page. */
  const [demoCallKinds, setDemoCallKinds] = useState<DemoDialerKind[]>([...DEMO_DIALER_KINDS]);
  const [admin, setAdmin] = useState(BLANK_ADMIN);
  /* Handle, theme, logo, design, timezone — all defaulted, so folded away. */
  const [showMore, setShowMore] = useState(false);
  const [addingAdminTo, setAddingAdminTo] = useState<string | null>(null);
  /*
   * Voice setup, per centre, opened from the row.
   *
   * Here rather than in the centre's own Settings because choosing an agent
   * means listing every workflow on the voice host, and a centre without its
   * own key is using the deployment's — so that list is other clients' agents.
   * The operator is the only party entitled to see it.
   */
  const [voiceFor, setVoiceFor] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState(BLANK_ADMIN);

  const orgs = useQuery({
    queryKey: ['platform-orgs'],
    queryFn: () => api.get<OrgSummary[]>('/platform/orgs'),
  });

  const reset = () => {
    setName('');
    setSlug('');
    setTimezone('Asia/Dubai');
    setIndustry('GENERIC');
    setThemePreset(null);
    setLogoUrl('');
    setTagline('');
    setWebsiteUrl('');
    setWebsiteEnabled(true);
    setSiteTemplate(null);
    setSimulatorEnabled(true);
    setDemoCallsEnabled(true);
    setDemoCallKinds([...DEMO_DIALER_KINDS]);
    setAdmin(BLANK_ADMIN);
    setShowMore(false);
    setCreating(false);
  };

  const createOrg = useMutation({
    mutationFn: (body: CreateOrgInput) => api.post<{ id: string }>('/platform/orgs', body),
    onSuccess: (res, body) => {
      void queryClient.invalidateQueries({ queryKey: ['platform-orgs'] });
      if (body.websiteUrl) {
        // The three agents are being built from the site; the slots fill
        // themselves, so there is nothing to pick yet.
        toast.success(
          `${body.name} created — ${body.admin.email} can sign in now. Building the landing page and voice agents from ${body.websiteUrl}…`,
        );
      } else {
        toast.success(`${body.name} created — ${body.admin.email} can sign in now`);
        // No site to build agents from, so land straight on the voice panel:
        // it is where inbound, outbound and info get pointed at agents, and
        // "test in browser" only means something once one is wired.
        if (body.demoCallsEnabled) setVoiceFor(res.id);
      }
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateOrg = useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string; isActive?: boolean; name?: string; themePreset?: ThemePreset }) =>
      api.put(`/platform/orgs/${id}`, body),
    onSuccess: (_res, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['platform-orgs'] });
      if (vars.themePreset) toast.success(`Theme set to ${THEME_PRESETS[vars.themePreset].label}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addAdmin = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & typeof BLANK_ADMIN) =>
      api.post(`/platform/orgs/${id}/admins`, body),
    onSuccess: (_res, vars) => {
      toast.success(`${vars.email} can now administer this centre`);
      void queryClient.invalidateQueries({ queryKey: ['platform-orgs'] });
      setAddingAdminTo(null);
      setNewAdmin(BLANK_ADMIN);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteOrg = useMutation({
    mutationFn: ({ id, confirmSlug }: { id: string; confirmSlug: string }) =>
      api.del<{ deleted: { name: string }; rows: Record<string, number> }>(
        `/platform/orgs/${id}`,
        // The handle is sent as the body's confirmation, which is what the API
        // checks — the browser prompt is a courtesy, not the guard.
        { confirmSlug },
      ),
    onSuccess: (res) => {
      const rows = Object.values(res.rows).reduce((n, c) => n + c, 0);
      toast.success(`${res.deleted.name} deleted — ${rows} rows removed`);
      void queryClient.invalidateQueries({ queryKey: ['platform-orgs'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Step into a centre read-only: set the header, then land on its live board. */
  const enter = (org: OrgSummary) => {
    viewOrg(org.id);
    // Cached queries belong to whatever was in scope before.
    queryClient.clear();
    router.push('/');
  };

  const effectivePreset: ThemePreset =
    themePreset ?? DEFAULT_PRESET_FOR_INDUSTRY[industry] ?? 'default';
  const rows = orgs.data ?? [];
  const active = rows.filter((o) => o.isActive);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <ShieldCheck className="size-5 text-primary" aria-hidden />
            Platform administration
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Onboard a clinic, a restaurant, a training institute — each arrives with its own
            queues, AI receptionist and number, and can see nothing of the others.
          </p>
        </div>
        <Button onClick={() => setCreating((v) => !v)}>
          <Plus className="size-4" aria-hidden />
          New contact centre
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Contact centres" value={String(rows.length)} />
        <Metric label="Active" value={String(active.length)} />
        <Metric label="Verticals" value={String(new Set(rows.map((o) => o.industry)).size)} />
        <Metric
          label="Staff accounts"
          value={String(rows.reduce((n, o) => n + o.counts.users, 0))}
        />
      </div>

      {creating && (
        <Card
          title="New contact centre"
          subtitle="Four things and you're done — everything else has a sensible default."
          contentClassName="p-4"
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createOrg.mutate({
                name,
                slug: slug || slugify(name),
                industry,
                ...(themePreset ? { themePreset } : {}),
                ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
                ...(tagline.trim() ? { tagline: tagline.trim() } : {}),
                ...(websiteEnabled && websiteUrl.trim()
                  ? { websiteUrl: websiteUrl.trim() }
                  : {}),
                websiteEnabled,
                ...(websiteEnabled && siteTemplate ? { siteTemplate } : {}),
                simulatorEnabled,
                demoCallsEnabled,
                demoCallKinds,
                timezone,
                admin: { ...admin, email: admin.email.trim().toLowerCase() },
              });
            }}
          >
            {/*
              The URL first, because it is the field that does the most: given
              one, the landing page and all three voice agents are generated
              from the client's own site. Everything below it is optional
              except the name and the admin's sign-in.
            */}
            <Field
              label="Their website"
              optional
              info={
                websiteEnabled ? (
                  <>
                    The centre is created immediately, then this site is read in the background to
                    write the landing page in their own words and build a Dograh voice agent for
                    each demo call ticked below, already wired into the Demo calls page and the
                    landing page&apos;s call panel. Progress
                    shows on their Website page. Leave empty and the centre uses the{' '}
                    {industry === 'GENERIC' ? 'generic' : INDUSTRY_LABELS[industry].toLowerCase()}{' '}
                    template instead.
                  </>
                ) : (
                  <>
                    Ignored while the landing page is off — the site is only read to generate the
                    page and its agents. Turn the landing page back on below to use it.
                  </>
                )
              }
            >
              <div className="relative">
                <Globe
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="url"
                  className="pl-8"
                  value={websiteUrl}
                  disabled={!websiteEnabled}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://theirbusiness.com"
                />
              </div>
              {websiteEnabled && websiteUrl.trim() && (
                <p className="flex items-center gap-1.5 text-[11px] text-primary">
                  <Sparkles className="size-3" aria-hidden />
                  Landing page + voice agents will be generated from this site
                </p>
              )}
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Centre name">
                <Input
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Northside Dental Clinic"
                />
              </Field>
              <Field
                label="Type of business"
                info={
                  <>
                    <span className="block font-medium text-foreground">
                      {INDUSTRY_TEMPLATES[industry].summary}
                    </span>
                    Provisions {INDUSTRY_TEMPLATES[industry].queues.map((q) => q.name).join(', ')}{' '}
                    queues, a “{INDUSTRY_TEMPLATES[industry].aiAgent.name}” AI agent,{' '}
                    {INDUSTRY_TEMPLATES[industry].knowledge.length} starter knowledge{' '}
                    {INDUSTRY_TEMPLATES[industry].knowledge.length === 1 ? 'document' : 'documents'}{' '}
                    and one phone number. The admin is enrolled in every queue so calls route on
                    day one.
                  </>
                }
              >
                <Select value={industry} onChange={(e) => setIndustry(e.target.value as Industry)}>
                  {IndustryEnum.options.map((i) => (
                    <option key={i} value={i}>
                      {INDUSTRY_LABELS[i]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                First admin — signs in with these
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  required
                  minLength={2}
                  aria-label="Admin name"
                  value={admin.name}
                  onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
                  placeholder="Name"
                />
                <Input
                  required
                  type="email"
                  aria-label="Admin email"
                  value={admin.email}
                  onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
                  placeholder="Email"
                />
                <Input
                  required
                  type="password"
                  minLength={8}
                  aria-label="Admin password"
                  value={admin.password}
                  onChange={(e) => setAdmin({ ...admin, password: e.target.value })}
                  placeholder="Password (8+ characters)"
                />
              </div>
            </div>

            {/* What the centre comes with. All on by default; ⓘ explains each. */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Includes</p>
              <div className="grid items-start gap-2 sm:grid-cols-3">
                <FeatureToggle
                  label="Landing page"
                  checked={websiteEnabled}
                  onChange={setWebsiteEnabled}
                  info={
                    websiteEnabled ? (
                      <>
                        A published page at{' '}
                        <code className="font-mono">/{slug || slugify(name) || 'handle'}</code> whose
                        call button dials this centre&apos;s number and whose callback form writes
                        into its contacts. Turn off for a client who already has a website.
                      </>
                    ) : (
                      <>
                        No page, and nothing served at{' '}
                        <code className="font-mono">/{slug || slugify(name) || 'handle'}</code>. The
                        Website section stays hidden until someone turns this back on.
                      </>
                    )
                  }
                />
                <FeatureToggle
                  label="Demo calls"
                  checked={demoCallsEnabled}
                  onChange={setDemoCallsEnabled}
                  info={
                    demoCallsEnabled ? (
                      <>
                        Each kind you tick gets a dialer on the centre&apos;s Demo calls page and an
                        option in the landing page&apos;s call panel. <strong>Inbound</strong>: the
                        visitor talks to the agent. <strong>Outbound</strong>: the agent rings them
                        back. <strong>Info</strong>: a short one-way call. With a website above, the
                        agents are built for you; without one, pick them in the Voice panel that
                        opens after creating.
                      </>
                    ) : (
                      <>No Demo calls section, and its endpoints refuse. Can be switched on later.</>
                    )
                  }
                >
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {DEMO_DIALER_KINDS.map((k) => (
                      <label key={k} className="flex cursor-pointer items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          className="size-3.5 accent-[var(--primary)]"
                          checked={demoCallKinds.includes(k)}
                          onChange={(e) =>
                            setDemoCallKinds((cur) =>
                              e.target.checked
                                ? DEMO_DIALER_KINDS.filter((x) => x === k || cur.includes(x))
                                : cur.filter((x) => x !== k),
                            )
                          }
                        />
                        {DEMO_DIALER_LABELS[k].label}
                      </label>
                    ))}
                  </div>
                  {demoCallKinds.length === 0 && (
                    <p className="mt-1 text-[11px] text-destructive">Tick at least one.</p>
                  )}
                </FeatureToggle>
                <FeatureToggle
                  label="Call simulator"
                  checked={simulatorEnabled}
                  onChange={setSimulatorEnabled}
                  info={
                    simulatorEnabled ? (
                      <>
                        A scripted caller driven through the real routing, AI handoff and queueing —
                        no carrier involved. Turn off for a client already taking real calls.
                      </>
                    ) : (
                      <>
                        No Simulator section and no &ldquo;Simulate a call&rdquo; shortcuts. Real
                        calls are untouched.
                      </>
                    )
                  }
                />
              </div>
            </div>

            {/* Everything with a good default lives behind one click. */}
            <div className="rounded-md border border-border">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
                aria-expanded={showMore}
                onClick={() => setShowMore((v) => !v)}
              >
                <span>
                  More options
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    handle, theme, logo, design, timezone
                  </span>
                </span>
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform ${showMore ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {showMore && (
                <div className="grid gap-3 border-t border-border p-3 md:grid-cols-2">
                  <Field label="Handle" info="The centre's address — its landing page lives at /handle.">
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder={name ? slugify(name) : 'northside-dental-clinic'}
                    />
                  </Field>
                  <Field label="Theme" info={THEME_PRESETS[effectivePreset].note}>
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="size-8 shrink-0 rounded-md border border-border"
                        style={{ background: THEME_PRESETS[effectivePreset].swatch }}
                      />
                      <Select
                        value={themePreset ?? ''}
                        onChange={(e) =>
                          setThemePreset((e.target.value || null) as ThemePreset | null)
                        }
                      >
                        <option value="">
                          Suits the vertical (
                          {THEME_PRESETS[DEFAULT_PRESET_FOR_INDUSTRY[industry] ?? 'default'].label})
                        </option>
                        {ThemePresetEnum.options.map((t) => (
                          <option key={t} value={t}>
                            {THEME_PRESETS[t].label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </Field>
                  <Field
                    label="Logo URL"
                    optional
                    info="Leave empty and a monogram is drawn from the name — the preview is what the sidebar, landing page and browser tab will show."
                  >
                    <div className="flex items-center gap-2">
                      <TenantLogo name={name || 'New centre'} logoUrl={logoUrl} size={32} />
                      <Input
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="Leave empty for a monogram"
                      />
                    </div>
                  </Field>
                  <Field label="Tagline" optional>
                    <Input
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="Family dentistry in Deira"
                    />
                  </Field>
                  {websiteEnabled && (
                    <Field
                      label="Landing design"
                      info={
                        siteTemplate
                          ? SITE_TEMPLATES[siteTemplate].note
                          : 'Each design is a finished page that fills itself from this centre’s own copy. Switching later keeps every word, because content is stored separately from layout.'
                      }
                    >
                      <Select
                        value={siteTemplate ?? ''}
                        onChange={(e) =>
                          setSiteTemplate((e.target.value || null) as SiteTemplate | null)
                        }
                      >
                        <option value="">
                          Suits the vertical ({SITE_TEMPLATES[defaultTemplateForIndustry(industry)].label})
                        </option>
                        {SiteTemplateEnum.options.map((t) => (
                          <option key={t} value={t}>
                            {SITE_TEMPLATES[t].label} — {SITE_TEMPLATES[t].bestFor}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}
                  <Field label="Timezone">
                    <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                      <option value="Asia/Dubai">Asia/Dubai</option>
                      <option value="Asia/Kolkata">Asia/Kolkata</option>
                      <option value="Africa/Cairo">Africa/Cairo</option>
                      <option value="Europe/London">Europe/London</option>
                    </Select>
                  </Field>
                  <Field label="Admin based in">
                    <Select
                      value={admin.location}
                      onChange={(e) => setAdmin({ ...admin, location: e.target.value as Location })}
                    >
                      <option value="DUBAI">Dubai</option>
                      <option value="INDIA">India</option>
                      <option value="EGYPT">Egypt</option>
                    </Select>
                  </Field>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={reset}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createOrg.isPending || (demoCallsEnabled && demoCallKinds.length === 0)}
              >
                {createOrg.isPending ? 'Creating…' : 'Create centre'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Contact centres" subtitle={`${rows.length} on this deployment`}>
        {orgs.isPending ? (
          <SkeletonRows rows={3} cols={5} />
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No contact centres yet. Create the first one above.
          </p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Centre</Th>
                <Th className="text-right">Staff</Th>
                <Th className="text-right">Queues</Th>
                <Th className="text-right">Conversations</Th>
                <Th className="text-right">Numbers</Th>
                <Th>Last sign-in</Th>
                <Th>Status</Th>
                <Th>Theme</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((org) => (
                <Fragment key={org.id}>
                  <tr>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        {/*
                          The centre's own mark, so the list reads as a portfolio
                          of clients rather than rows of text.

                          The monogram colour is passed explicitly here, unlike
                          everywhere else: a monogram normally inherits
                          `var(--primary)`, which is correct inside a centre but
                          on this page is HireStella's own red — so every client
                          came out the same colour in the one view whose job is
                          comparing them.
                        */}
                        <TenantLogo
                          name={org.name}
                          logoUrl={org.logoUrl}
                          size={28}
                          monogramBackground={THEME_PRESETS[org.themePreset].swatch}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{org.name}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {INDUSTRY_LABELS[org.industry]} ·{' '}
                            <a
                              href={`/${org.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                              title={
                                org.site?.isPublished
                                  ? 'Open the landing page'
                                  : 'Landing page is unpublished'
                              }
                            >
                              /{org.slug}
                              <ExternalLink className="size-2.5" aria-hidden />
                            </a>
                            {org.site && !org.site.isPublished && ' · page unpublished'}
                            {org.site && org.site.leads > 0 && ` · ${org.site.leads} web leads`}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-right">
                      {org.counts.users}
                      <span className="text-muted-foreground"> ({org.counts.admins} admin)</span>
                    </Td>
                    <Td className="text-right">{org.counts.queues}</Td>
                    <Td className="text-right">{org.counts.conversations}</Td>
                    <Td className="text-right">{org.counts.numbers}</Td>
                    <Td>
                      {org.lastLoginAt ? (
                        dateTime(org.lastLoginAt)
                      ) : (
                        <span className="text-muted-foreground">never</span>
                      )}
                    </Td>
                    <Td>
                      <Badge
                        dot={org.isActive ? 'bg-live' : 'bg-muted-foreground'}
                        className={org.isActive ? '' : 'text-muted-foreground'}
                      >
                        {org.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="size-5 shrink-0 rounded border border-border"
                          style={{ background: THEME_PRESETS[org.themePreset].swatch }}
                        />
                        <Select
                          aria-label={`Theme for ${org.name}`}
                          className="h-8 w-36 text-xs"
                          value={org.themePreset}
                          disabled={updateOrg.isPending}
                          onChange={(e) =>
                            updateOrg.mutate({
                              id: org.id,
                              themePreset: e.target.value as ThemePreset,
                            })
                          }
                        >
                          {ThemePresetEnum.options.map((t) => (
                            <option key={t} value={t}>
                              {THEME_PRESETS[t].label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      {org.themeTokens && (
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">
                          custom tokens override this
                        </span>
                      )}
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          disabled={!org.isActive}
                          title={
                            org.isActive
                              ? 'Open this centre read-only'
                              : 'Reactivate the centre to view it'
                          }
                          onClick={() => enter(org)}
                        >
                          <Eye className="size-3.5" aria-hidden />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() =>
                            setAddingAdminTo(addingAdminTo === org.id ? null : org.id)
                          }
                        >
                          <UserPlus className="size-3.5" aria-hidden />
                          Admin
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() => setVoiceFor(voiceFor === org.id ? null : org.id)}
                        >
                          <Mic className="size-3.5" aria-hidden />
                          Voice
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          disabled={updateOrg.isPending}
                          onClick={() => {
                            // Suspension locks out every one of their staff at
                            // once, so it asks first.
                            if (
                              org.isActive &&
                              !window.confirm(
                                `Suspend ${org.name}? All ${org.counts.users} of their accounts will be signed out and unable to sign back in.`,
                              )
                            ) {
                              return;
                            }
                            updateOrg.mutate({ id: org.id, isActive: !org.isActive });
                          }}
                        >
                          {org.isActive ? 'Suspend' : 'Reactivate'}
                        </Button>
                        {/*
                          Deleting is for discarding a demo, so it asks for the
                          handle rather than a yes/no — the same confirmation the
                          API insists on. Suspend is the reversible action and is
                          what a real client should ever get.
                        */}
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                          disabled={deleteOrg.isPending}
                          title="Delete this centre and everything in it"
                          onClick={() => {
                            const typed = window.prompt(
                              `Delete ${org.name} permanently?\n\n` +
                                `${org.counts.users} accounts, ${org.counts.conversations} conversations ` +
                                `and its landing page will be destroyed. This cannot be undone — ` +
                                `Suspend instead if you may want it back.\n\n` +
                                `Type the handle "${org.slug}" to confirm:`,
                            );
                            if (typed === null) return;
                            if (typed.trim() !== org.slug) {
                              toast.error('That is not the handle — nothing was deleted');
                              return;
                            }
                            deleteOrg.mutate({ id: org.id, confirmSlug: org.slug });
                          }}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      </div>
                    </Td>
                  </tr>

                  {addingAdminTo === org.id && (
                    <tr>
                      <Td className="bg-muted/40" colSpan={9}>
                        <form
                          className="flex flex-wrap items-end gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            addAdmin.mutate({
                              id: org.id,
                              ...newAdmin,
                              email: newAdmin.email.trim().toLowerCase(),
                            });
                          }}
                        >
                          <span className="text-xs text-muted-foreground">
                            Add an admin to {org.name}:
                          </span>
                          <Input
                            required
                            minLength={2}
                            className="h-8 w-40 text-xs"
                            placeholder="Name"
                            value={newAdmin.name}
                            onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                          />
                          <Input
                            required
                            type="email"
                            className="h-8 w-52 text-xs"
                            placeholder="Email"
                            value={newAdmin.email}
                            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                          />
                          <Input
                            required
                            type="password"
                            minLength={8}
                            className="h-8 w-40 text-xs"
                            placeholder="Password"
                            value={newAdmin.password}
                            onChange={(e) =>
                              setNewAdmin({ ...newAdmin, password: e.target.value })
                            }
                          />
                          <Button type="submit" className="h-8 text-xs" disabled={addAdmin.isPending}>
                            {addAdmin.isPending ? 'Adding…' : 'Add admin'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 text-xs"
                            onClick={() => setAddingAdminTo(null)}
                          >
                            Cancel
                          </Button>
                        </form>
                      </Td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/*
        A dialog, not a row or a card.
        Inside the table a full-width panel inherits the table's horizontal
        scroll and half of it ends up off-screen; below the table, it opened
        out of sight and the Voice button looked like it did nothing.
      */}
      <Dialog open={voiceFor !== null} onOpenChange={(open) => !open && setVoiceFor(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="size-4" aria-hidden />
              Voice — {rows.find((o) => o.id === voiceFor)?.name ?? ''}
            </DialogTitle>
            <DialogDescription>
              Connect the voice host, then choose which agent answers the landing page and each
              demo-call slot. Centres created from a website get all three agents built for them.
            </DialogDescription>
          </DialogHeader>
          {voiceFor && (
            <>
              <DograhConnection orgId={voiceFor} />
              <PlatformDialers orgId={voiceFor} />
            </>
          )}
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        A platform operator can read a centre but never write to it — the API refuses any change
        made while viewing one, with one deliberate exception: voice setup, which is operator-only
        because the agent list covers every centre on the host. To alter anything else in a
        client’s configuration, sign in as one of their admins.
      </p>
    </div>
  );
}

/**
 * A labelled field whose explanation is one click away.
 *
 * The form used to print every explanation under every field, which is why it
 * read as a wall of text. The ⓘ keeps the same words available without making
 * someone who already knows them scroll past them.
 */
function Field({
  label,
  optional,
  info,
  children,
}: {
  label: string;
  optional?: boolean;
  info?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">
          {label}
          {optional && <span className="text-[11px]"> · optional</span>}
        </span>
        {info && <InfoButton label={label} open={open} onClick={() => setOpen((v) => !v)} />}
      </div>
      {children}
      {info && open && <InfoText>{info}</InfoText>}
    </div>
  );
}

/** One of the "Includes" switches, with its explanation behind an ⓘ. */
function FeatureToggle({
  label,
  checked,
  onChange,
  info,
  children,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  info: ReactNode;
  /** Sub-options, shown only while the feature is on. */
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-md border p-2.5 transition-colors ${
        checked ? 'border-primary/40 bg-primary/5' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 shrink-0 accent-[var(--primary)]"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          {label}
        </label>
        <InfoButton label={label} open={open} onClick={() => setOpen((v) => !v)} />
      </div>
      {checked && children && <div className="mt-2 pl-6">{children}</div>}
      {open && <InfoText className="mt-2">{info}</InfoText>}
    </div>
  );
}

function InfoButton({ label, open, onClick }: { label: string; open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={`About ${label}`}
      aria-expanded={open}
      onClick={onClick}
      className={`rounded-full p-0.5 transition-colors hover:text-foreground ${
        open ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      <Info className="size-3.5" aria-hidden />
    </button>
  );
}

function InfoText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`rounded-md bg-muted/60 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground ${className}`}
    >
      {children}
    </p>
  );
}
