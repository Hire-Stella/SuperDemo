'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ExternalLink, Eye, Mic, Plus, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import {
  DEFAULT_PRESET_FOR_INDUSTRY,
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
   * other two. This only decides whether the page and its endpoints exist —
   * picking which agent answers inbound, outbound and info happens after
   * creation, in the voice panel below, because that picker lists every
   * workflow on the voice host and there is no centre yet for this form to
   * scope that list to.
   */
  const [demoCallsEnabled, setDemoCallsEnabled] = useState(true);
  const [admin, setAdmin] = useState(BLANK_ADMIN);
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
    setAdmin(BLANK_ADMIN);
    setCreating(false);
  };

  const createOrg = useMutation({
    mutationFn: (body: CreateOrgInput) => api.post<{ id: string }>('/platform/orgs', body),
    onSuccess: (res, body) => {
      toast.success(`${body.name} created — ${body.admin.email} can sign in now`);
      void queryClient.invalidateQueries({ queryKey: ['platform-orgs'] });
      // Land straight on the voice panel rather than making them find the row
      // and click into it themselves — this is the picker for inbound,
      // outbound and info, and "test in browser" only means something once an
      // agent is actually wired to a slot.
      if (body.demoCallsEnabled) setVoiceFor(res.id);
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
          subtitle="Creating a centre also creates its first admin — an org nobody can sign into is of no use."
          contentClassName="p-4"
        >
          <form
            className="grid gap-3 md:grid-cols-2"
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
                timezone,
                admin: { ...admin, email: admin.email.trim().toLowerCase() },
              });
            }}
          >
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Centre name</span>
              <Input
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Northside Dental Clinic"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Handle</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder={name ? slugify(name) : 'northside-dental-clinic'}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Type of business</span>
              <Select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as Industry)}
              >
                {IndustryEnum.options.map((i) => (
                  <option key={i} value={i}>
                    {INDUSTRY_LABELS[i]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Theme</span>
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
                    Suits the vertical ({THEME_PRESETS[DEFAULT_PRESET_FOR_INDUSTRY[industry] ?? 'default'].label})
                  </option>
                  {ThemePresetEnum.options.map((t) => (
                    <option key={t} value={t}>
                      {THEME_PRESETS[t].label}
                    </option>
                  ))}
                </Select>
              </div>
              <span className="block text-[11px] text-muted-foreground">
                {THEME_PRESETS[effectivePreset].note}
              </span>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Timezone</span>
              <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="Africa/Cairo">Africa/Cairo</option>
                <option value="Europe/London">Europe/London</option>
              </Select>
            </label>

            {/*
              Identity, and both optional.

              This is the block that makes a demo take a minute rather than an
              afternoon: with no logo the platform draws a monogram from the
              name, so the preview beside the field is what the centre will
              actually look like everywhere — sidebar, landing page, browser tab.
            */}
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Logo URL — optional</span>
              <div className="flex items-center gap-2">
                <TenantLogo name={name || 'New centre'} logoUrl={logoUrl} size={32} />
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Leave empty for a monogram"
                />
              </div>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Tagline — optional</span>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Family dentistry in Deira"
              />
            </label>

            <div className="space-y-2 rounded-md border border-border p-3 md:col-span-2">
              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                  checked={websiteEnabled}
                  onChange={(e) => setWebsiteEnabled(e.target.checked)}
                />
                <span>
                  <span className="font-medium">Give this centre a landing page</span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                    {websiteEnabled ? (
                      <>
                        A published page at <code className="font-mono">/{slug || slugify(name) || 'handle'}</code>{' '}
                        whose call button dials this centre&apos;s number and whose callback form writes
                        into its contacts. Turn off for a client who already has a website — the
                        queues, assistant, knowledge and number are created either way, and the
                        Website section is hidden from their sidebar.
                      </>
                    ) : (
                      <>
                        No page, and nothing served at{' '}
                        <code className="font-mono">/{slug || slugify(name) || 'handle'}</code>. The
                        Website section stays hidden until someone turns this back on, in their
                        Settings or here. Everything else about the centre is unchanged.
                      </>
                    )}
                  </span>
                </span>
              </label>

              {websiteEnabled && (
                <label className="block space-y-1 text-sm">
                  <span className="text-muted-foreground">Their website — optional</span>
                  <Input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://theirbusiness.com"
                  />
                  <span className="block text-[11px] leading-relaxed text-muted-foreground">
                    {websiteUrl.trim() ? (
                      <>
                        The centre is created immediately from the{' '}
                        {INDUSTRY_LABELS[industry].toLowerCase()} template, then this site is read in
                        the background to rewrite the landing page in their own words and build a
                        voice agent briefed on what they actually do. Progress shows on their Website
                        page.
                      </>
                    ) : (
                      <>
                        Leave empty and the centre is built from the vertical template — real copy,
                        but generic. Give a URL and the page and the voice agent are generated from
                        it.
                      </>
                    )}
                  </span>
                </label>
              )}

              {websiteEnabled && (
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="text-muted-foreground">Landing design</span>
                  <Select
                    className="mt-1.5"
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
                  <span className="block text-[11px] leading-relaxed text-muted-foreground">
                    {siteTemplate
                      ? SITE_TEMPLATES[siteTemplate].note
                      : 'Each design is a finished page that fills itself from this centre\u2019s own copy. The choice is reversible \u2014 switching later keeps every word, because content is stored separately from layout.'}
                  </span>
                </label>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border p-3 text-sm md:col-span-2">
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                checked={simulatorEnabled}
                onChange={(e) => setSimulatorEnabled(e.target.checked)}
              />
              <span>
                <span className="font-medium">Give this centre the call simulator</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                  {simulatorEnabled ? (
                    <>
                      A scripted caller driven through the real routing, AI handoff and queueing —
                      no carrier involved. The fastest way to prove a centre works on its first day.
                      Turn off for a client already taking real calls, where a button that invents
                      one is a support ticket waiting to happen.
                    </>
                  ) : (
                    <>
                      No Simulator section and no &ldquo;Simulate a call&rdquo; shortcuts on Live
                      ops. Real calls, the softphone and every other surface are untouched, and this
                      can be switched back on at any time.
                    </>
                  )}
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border p-3 text-sm md:col-span-2">
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                checked={demoCallsEnabled}
                onChange={(e) => setDemoCallsEnabled(e.target.checked)}
              />
              <span>
                <span className="font-medium">Give this centre demo calls</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                  {demoCallsEnabled ? (
                    <>
                      Three dialer slots — inbound, outbound, info — each pointed at a Dograh agent
                      of your choosing right after this centre is created, then dialable or talkable
                      in the browser from its own Demo calls page. Turn off for a client with no
                      Dograh agent to show.
                    </>
                  ) : (
                    <>
                      No Demo calls section, and its endpoints refuse. Everything else about the
                      centre is unchanged, and this can be switched back on at any time.
                    </>
                  )}
                </span>
              </span>
            </label>

            {/* Says what the button will actually do, so the operator is not
                guessing what a "clinic" gets. */}
            <div className="md:col-span-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs">
              <p className="font-medium">{INDUSTRY_TEMPLATES[industry].summary}</p>
              <p className="mt-1.5 text-muted-foreground">
                Provisions{' '}
                <strong className="font-medium text-foreground">
                  {INDUSTRY_TEMPLATES[industry].queues.map((q) => q.name).join(', ')}
                </strong>{' '}
                queues, a “{INDUSTRY_TEMPLATES[industry].aiAgent.name}” AI agent,{' '}
                {INDUSTRY_TEMPLATES[industry].knowledge.length} placeholder knowledge{' '}
                {INDUSTRY_TEMPLATES[industry].knowledge.length === 1 ? 'document' : 'documents'} and
                one phone number. The admin is enrolled in every queue so calls route on day one.
              </p>
              <p className="mt-1.5 text-muted-foreground">
                {websiteEnabled ? (
                  <>
                    Also a published landing page at{' '}
                    <strong className="font-medium text-foreground">
                      /{slug || slugify(name) || 'handle'}
                    </strong>
                    , whose call button dials that number and whose callback form creates a contact
                    in this centre.
                  </>
                ) : (
                  <>
                    No landing page:{' '}
                    <strong className="font-medium text-foreground">
                      /{slug || slugify(name) || 'handle'}
                    </strong>{' '}
                    will not resolve, and the Website section is hidden for this centre until
                    somebody turns it on.
                  </>
                )}
              </p>
            </div>

            <div className="md:col-span-2 mt-1 border-t border-border pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                First admin
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <Input
                    required
                    minLength={2}
                    value={admin.name}
                    onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
                    placeholder="Layla Haddad"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <Input
                    required
                    type="email"
                    value={admin.email}
                    onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
                    placeholder="admin@northside.com"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Password</span>
                  <Input
                    required
                    type="password"
                    minLength={8}
                    value={admin.password}
                    onChange={(e) => setAdmin({ ...admin, password: e.target.value })}
                    placeholder="At least 8 characters"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Based in</span>
                  <Select
                    value={admin.location}
                    onChange={(e) =>
                      setAdmin({ ...admin, location: e.target.value as Location })
                    }
                  >
                    <option value="DUBAI">Dubai</option>
                    <option value="INDIA">India</option>
                    <option value="EGYPT">Egypt</option>
                  </Select>
                </label>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={reset}>
                Cancel
              </Button>
              <Button type="submit" disabled={createOrg.isPending}>
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
        Below the table, not inside it.
        The rows live in a horizontally scrolling table, and a full-width panel
        in a colSpan cell inherits that scroll — half of it ends up off-screen
        with no way to reach it.
      */}
      {voiceFor && (
        <Card
          title={`Voice — ${rows.find((o) => o.id === voiceFor)?.name ?? ''}`}
          subtitle="The agent list spans the whole voice host, which is why this lives here and not in the centre's own settings"
          contentClassName="p-4"
        >
          <DograhConnection orgId={voiceFor} />
          <PlatformDialers orgId={voiceFor} />
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        A platform operator can read a centre but never write to it — the API refuses any change
        made while viewing one, with one deliberate exception: voice setup, which is operator-only
        because the agent list covers every centre on the host. To alter anything else in a
        client’s configuration, sign in as one of their admins.
      </p>
    </div>
  );
}
