'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, Eye, Plus, ShieldCheck, UserPlus } from 'lucide-react';
import {
  DEFAULT_PRESET_FOR_INDUSTRY,
  INDUSTRY_LABELS,
  INDUSTRY_TEMPLATES,
  Industry as IndustryEnum,
  THEME_PRESETS,
  ThemePreset as ThemePresetEnum,
  type ThemePreset,
  type CreateOrgInput,
  type Industry,
  type Location,
  type OrgSummary,
} from '@fit-ai/contracts';
import { api } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { useSession } from '@/components/providers';
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
  const [admin, setAdmin] = useState(BLANK_ADMIN);
  const [addingAdminTo, setAddingAdminTo] = useState<string | null>(null);
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
    setAdmin(BLANK_ADMIN);
    setCreating(false);
  };

  const createOrg = useMutation({
    mutationFn: (body: CreateOrgInput) => api.post('/platform/orgs', body),
    onSuccess: (_res, body) => {
      toast.success(`${body.name} created — ${body.admin.email} can sign in now`);
      void queryClient.invalidateQueries({ queryKey: ['platform-orgs'] });
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
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{org.name}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {INDUSTRY_LABELS[org.industry]} · {org.slug}
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

      <p className="text-xs text-muted-foreground">
        A platform operator can read a centre but never write to it — the API refuses any change
        made while viewing one. To alter a client’s configuration, sign in as one of their admins.
      </p>
    </div>
  );
}
