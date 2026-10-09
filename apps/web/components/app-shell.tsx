'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  Eye,
  FlaskConical,
  Globe,
  Inbox,
  LogOut,
  PhoneCall,
  PhoneForwarded,
  PhoneOutgoing,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { AGENT_STATUS_STYLE } from '@/lib/format';
import type { AgentStatus, AgentSummary, OrgSummary } from '@superdemo/contracts';
import { api } from '@/lib/api';
import { useSession } from '@/components/providers';
import { SignalTriangle } from '@hire-stella/ui';
import { PLATFORM_NAME } from '@/lib/platform';
import { PlatformMark } from '@/components/platform-mark';
import { TenantTheme } from '@/components/tenant-theme';
import { TenantLogo } from '@/components/tenant-logo';
import { Softphone } from '@/components/softphone';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, Select, Spinner, cn } from '@/components/composites';

/**
 * SUPERADMIN appears only on read-only surfaces, and even those only while it is
 * actually inside a centre — see `nav` below. Its absence from Simulator,
 * Knowledge, AI assistant and Settings is deliberate: those pages exist to
 * change a centre's configuration, and the API refuses a platform operator's
 * writes, so showing them would only offer a button that 403s.
 */
const NAV = [
  { href: '/superadmin', label: 'Contact centres', icon: Building2, roles: ['SUPERADMIN'] },
  {
    href: '/',
    label: 'Live ops',
    icon: Activity,
    roles: ['ADMIN', 'SUPERVISOR', 'AGENT', 'SUPERADMIN'],
  },
  {
    href: '/conversations',
    label: 'Inbox',
    icon: Inbox,
    roles: ['ADMIN', 'SUPERVISOR', 'AGENT', 'SUPERADMIN'],
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: ['ADMIN', 'SUPERVISOR', 'SUPERADMIN'],
  },
  { href: '/agents', label: 'Agents', icon: Users, roles: ['ADMIN', 'SUPERVISOR', 'SUPERADMIN'] },
  { href: '/ai-agent', label: 'AI assistant', icon: Sparkles, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/knowledge', label: 'Knowledge', icon: BookOpen, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/campaigns', label: 'Outbound', icon: PhoneOutgoing, roles: ['ADMIN', 'SUPERVISOR'] },
  // Everyone on the floor reads it — an agent taking a call needs to know who
  // is coming in as much as anyone. Booking and the hours are guarded on the
  // page and by the API, not by hiding the section.
  {
    href: '/calendar',
    label: 'Calendar',
    icon: CalendarDays,
    roles: ['ADMIN', 'SUPERVISOR', 'AGENT', 'SUPERADMIN'],
  },
  // Agents get this one: a telecaller is an agent, and manual dialling is the
  // only outbound action that is theirs rather than an admin's.
  {
    href: '/telecaller',
    label: 'Manual dial',
    icon: PhoneCall,
    roles: ['ADMIN', 'SUPERVISOR', 'AGENT'],
  },
  // Three Dograh agents on one page. Not an agent's concern — it rings real
  // handsets on the client's carrier account, which is a supervisor's call.
  {
    href: '/demo-calls',
    label: 'Demo calls',
    icon: PhoneForwarded,
    roles: ['ADMIN', 'SUPERVISOR'],
  },
  { href: '/simulator', label: 'Simulator', icon: FlaskConical, roles: ['ADMIN', 'SUPERVISOR'] },
  // The centre's public landing page. Not an agent's concern, and not a
  // read-only surface either — it is configuration, so an operator is excluded
  // for the same reason they are excluded from Settings.
  { href: '/website', label: 'Website', icon: Globe, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN', 'SUPERVISOR'] },
] as const;

/** Tenant pages need a centre in context; only /superadmin does not. */
const PLATFORM_ONLY_PATHS = ['/superadmin'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, socket, viewingOrgId, viewOrg } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const isOperator = user?.role === 'SUPERADMIN';
  const onPlatformPage = PLATFORM_ONLY_PATHS.includes(pathname);
  // An operator with no centre selected would otherwise read across every
  // tenant at once, which is neither useful nor something we want to render.
  const needsOrg = isOperator && !viewingOrgId && !onPlatformPage;
  /** True only while the operator is actually inside one centre. */
  const insideCentre = isOperator && Boolean(viewingOrgId) && !onPlatformPage;

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (needsOrg) router.replace('/superadmin');
  }, [needsOrg, router]);

  /*
   * A user restricted to some sections should not reach the rest by typing the
   * URL or following an in-page link, so landing on one sends them home. Live
   * ops is never blocked here so the redirect cannot loop.
   */
  const allowlist = user?.navAllowlist ?? [];
  const blockedPath =
    allowlist.length > 0 &&
    pathname !== '/' &&
    NAV.some((n) => n.href !== '/' && pathname.startsWith(n.href) && !allowlist.includes(n.href));
  useEffect(() => {
    if (blockedPath) router.replace('/');
  }, [blockedPath, router]);

  /**
   * Leaving a centre is an explicit act, not a side effect of being on the
   * platform page.
   *
   * An effect that cleared the org whenever the pathname was /superadmin raced
   * the View button: selecting a centre sets the org while still on that page,
   * the effect immediately cleared it, and the operator bounced straight back.
   * `insideCentre` already hides the banner and the centre's nav items on
   * platform pages, so nothing has to be cleared for the display to be right.
   */
  const leaveCentre = () => {
    viewOrg(null);
    // Cached queries hold that centre's data under keys we are about to reuse.
    queryClient.clear();
  };

  // Operators only: the centre they are viewing is not in their session, so its
  // name (for the banner) and theme come from the platform listing.
  const orgs = useQuery({
    queryKey: ['platform-orgs'],
    queryFn: () => api.get<OrgSummary[]>('/platform/orgs'),
    enabled: isOperator,
  });
  const viewedOrg = orgs.data?.find((o) => o.id === viewingOrgId);

  /* Presence control — an agent must be able to go on break from anywhere. */
  const roster = useQuery({
    queryKey: ['presence-roster', viewingOrgId],
    queryFn: () => api.get<AgentSummary[]>('/presence/roster'),
    // A platform operator has no presence of their own to manage.
    enabled: Boolean(user) && !isOperator,
    refetchInterval: 30_000,
  });

  const setPresence = useMutation({
    mutationFn: (status: AgentStatus) => api.post('/presence', { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['presence-roster'] }),
  });

  /* Any presence change from the server refreshes the roster. */
  useEffect(() => {
    if (!socket) return;
    const refresh = () => void queryClient.invalidateQueries({ queryKey: ['presence-roster'] });
    socket.on('presence.changed', refresh);
    return () => void socket.off('presence.changed', refresh);
  }, [socket, queryClient]);

  if (loading || !user) return <Spinner label="Loading…" />;
  if (needsOrg) return <Spinner label="Choose a contact centre…" />;
  if (blockedPath) return <Spinner label="Loading…" />;

  const me = roster.data?.find((a) => a.id === user.id);
  const myStatus: AgentStatus = me?.status ?? 'OFFLINE';
  const statusStyle = AGENT_STATUS_STYLE[myStatus];
  /**
   * Whose brand the shell wears.
   *
   * The same rule as the theme immediately below: staff see their own centre, an
   * operator inside a centre sees that centre, and an operator on the platform
   * page sees the platform. Null is the "no tenant" case, not a missing value.
   */
  const brand = isOperator
    ? insideCentre && viewedOrg
      ? { name: viewedOrg.name, logoUrl: viewedOrg.logoUrl, tagline: viewedOrg.tagline }
      : null
    : user.orgName
      ? { name: user.orgName, logoUrl: user.orgLogoUrl, tagline: user.orgTagline }
      : null;

  const nav = NAV.filter((n) => {
    if (!(n.roles as readonly string[]).includes(user.role)) return false;
    /*
     * A centre that declined a landing page should not carry the section
     * around. Only an explicit `false` hides it: the flag is null for an
     * operator, who has no org of their own, and hiding it from them would
     * take away the place it gets turned back on.
     */
    if (n.href === '/website' && user.orgWebsiteEnabled === false) return false;
    if (n.href === '/simulator' && user.orgSimulatorEnabled === false) return false;
    if (n.href === '/demo-calls' && user.orgDemoCallsEnabled === false) return false;
    // A centre's pages are only reachable from inside that centre. On the
    // platform page they would render another tenant's data or nothing at all,
    // so the operator gets exactly one item until they pick a centre.
    if (isOperator && n.href !== '/superadmin') return insideCentre;
    return true;
  });
  /** Shown but greyed out: this user has these sections switched off. */
  const isDisabled = (href: string) => allowlist.length > 0 && !allowlist.includes(href);

  return (
    // h-dvh + overflow-hidden, not min-h-dvh: the shell is exactly the viewport
    // and only <main> scrolls. With min-h-dvh a long page grew the flex row, so
    // the sidebar scrolled away with the content and nav was lost.
    <div className="hs-app flex h-dvh overflow-hidden">
      {/* A tenant's brand follows whoever's data is on screen: their own for
          staff, the viewed centre's for an operator, the platform's otherwise. */}
      <TenantTheme
        preset={isOperator ? (insideCentre ? viewedOrg?.themePreset : null) : user.orgThemePreset}
        tokens={isOperator ? (insideCentre ? viewedOrg?.themeTokens : null) : user.orgThemeTokens}
      />
      {/* sidebar — pinned; never scrolls with the page */}
      <aside className="hidden h-dvh w-60 shrink-0 flex-col overflow-hidden border-r border-[var(--sidebar-border)] bg-sidebar md:flex">
        {/*
          The centre's own identity, not the platform's.

          An agent spends their whole shift in this app and it should look like
          their employer's tool, so the mark and the name belong to the tenant
          and HireStella is reduced to a line at the bottom. A platform operator
          is the exception — outside a centre there is no tenant to show, so they
          get the product's own badge.
        */}
        <div className="flex items-center gap-2.5 px-4 py-4">
          {brand ? (
            <TenantLogo name={brand.name} logoUrl={brand.logoUrl} size={32} />
          ) : (
            <PlatformMark variant="symbol" width={30} />
          )}
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--hs-font-display)] text-[15px] font-semibold tracking-[-0.015em]">
              {brand?.name ?? PLATFORM_NAME}
            </p>
            {/* Whose data you are looking at, which for an operator is nobody's
                until they enter a centre. */}
            <p className="truncate text-[11px] text-muted-foreground">
              {isOperator
                ? insideCentre
                  ? 'Viewing as operator'
                  : 'Platform operator'
                : (brand?.tagline ?? 'Contact centre')}
            </p>
          </div>
        </div>

        {/* min-h-0 lets this shrink inside the flex column so the identity block
            below stays pinned; the links scroll internally only if they must. */}
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            if (isDisabled(href)) {
              return (
                <span
                  key={href}
                  aria-disabled="true"
                  title="Not enabled for your account"
                  className="flex cursor-not-allowed select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground/40"
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </span>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                // For an operator, going back to the list is how you leave a
                // centre — so the click that navigates is the click that drops
                // its scope and cached data.
                onClick={href === '/superadmin' && insideCentre ? leaveCentre : undefined}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-10 items-center gap-3 rounded-xl border px-3 text-[13.5px] font-medium transition-colors',
                  active
                    ? 'border-[var(--hs-border-selected)] bg-[var(--hs-glass-strong)] text-foreground [&>svg]:text-primary'
                    : 'border-transparent text-muted-foreground hover:bg-[var(--hs-glass)] hover:text-foreground',
                )}
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={1.5} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* presence + identity */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} color={user.avatarColor} size={30} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user.role.toLowerCase()} · {user.location.toLowerCase()}
              </p>
            </div>
            <button
              onClick={() => void logout()}
              className="rounded p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-3.5" aria-hidden />
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>

          <div className={cn('mt-2.5', isOperator && 'hidden')}>
            <div className="mb-1 flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', statusStyle.dot)} aria-hidden />
              <span className={cn('text-[11px] font-medium', statusStyle.text)}>
                {statusStyle.label}
              </span>
            </div>
            <Select
              value={myStatus}
              disabled={setPresence.isPending || myStatus === 'ON_CALL' || myStatus === 'WRAPUP'}
              onChange={(e) => setPresence.mutate(e.target.value as AgentStatus)}
              className="h-8 text-xs"
              aria-label="Set my availability"
            >
              <option value="AVAILABLE">Available</option>
              <option value="BREAK">On break</option>
              <option value="OFFLINE">Offline</option>
              {(myStatus === 'ON_CALL' || myStatus === 'WRAPUP') && (
                <option value={myStatus}>{statusStyle.label}</option>
              )}
            </Select>
            {(myStatus === 'ON_CALL' || myStatus === 'WRAPUP') && (
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                Finish the call to change status.
              </p>
            )}
          </div>

          {/* Where the platform's own name lives once the sidebar wears the
              tenant's. Quiet on purpose: the centre's staff should think of this
              as their tool, and the operator already knows whose it is. */}
          {brand && (
            <p className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground/70 uppercase">
              <SignalTriangle size={8} tone="inactive" /> Powered by {PLATFORM_NAME}
            </p>
          )}
        </div>
      </aside>

      {/* mobile nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-sidebar/95 py-1 backdrop-blur md:hidden">
        {nav
          .filter((n) => !isDisabled(n.href))
          .slice(0, 5)
          .map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] font-medium',
                  active ? 'text-foreground [&>svg]:text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
      </nav>

      {/* the only scroll container */}
      <main className="min-w-0 flex-1 overflow-y-auto pb-16 md:pb-0">
        {/* Sticky, not a one-off toast: an operator reading a client's live
            board should never be in any doubt about whose data is on screen. */}
        {insideCentre && (
          <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-dashed border-[var(--hs-handoff)] bg-[color-mix(in_srgb,var(--background)_82%,var(--hs-mist))] px-4 py-2 text-xs backdrop-blur">
            <span className="flex min-w-0 items-center gap-2 text-foreground">
              <Eye className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">
                Viewing{' '}
                <strong className="font-semibold">{viewedOrg?.name ?? 'a client centre'}</strong> as
                a platform operator — read-only.
              </span>
            </span>
            <button
              onClick={() => {
                leaveCentre();
                router.push('/superadmin');
              }}
              className="hs-btn hs-btn--secondary hs-sd-btn hs-sd-btn--xs shrink-0"
            >
              Leave
            </button>
          </div>
        )}
        {children}
      </main>

      {/* Docked so an agent can browse while on a call. Two exceptions:
          an operator cannot take a call, so it would be a dead panel for them;
          and on the dialler the console already owns the call — leaving the
          softphone mounted there put two wrap-up forms on screen at once, the
          second one labelled "Unknown caller" because it expects an inbound
          screen-pop it never got.

          The trade-off: an inbound offer will not pop while a telecaller is on
          that page. Acceptable because routing only offers calls to AVAILABLE
          agents, and someone working the dialler is on a call or about to place
          one. */}
      {!isOperator && pathname !== '/telecaller' && <Softphone />}
    </div>
  );
}
