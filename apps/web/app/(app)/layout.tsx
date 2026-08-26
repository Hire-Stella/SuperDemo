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
  Eye,
  FlaskConical,
  Headphones,
  Inbox,
  LogOut,
  PhoneCall,
  PhoneOutgoing,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { AGENT_STATUS_STYLE } from '@/lib/format';
import type { AgentStatus, AgentSummary, OrgSummary } from '@fit-ai/contracts';
import { api } from '@/lib/api';
import { useSession } from '@/components/providers';
import { PLATFORM_NAME } from '@/lib/platform';
import { TenantTheme } from '@/components/tenant-theme';
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
  { href: '/', label: 'Live ops', icon: Activity, roles: ['ADMIN', 'SUPERVISOR', 'AGENT', 'SUPERADMIN'] },
  { href: '/conversations', label: 'Inbox', icon: Inbox, roles: ['ADMIN', 'SUPERVISOR', 'AGENT', 'SUPERADMIN'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['ADMIN', 'SUPERVISOR', 'SUPERADMIN'] },
  { href: '/agents', label: 'Agents', icon: Users, roles: ['ADMIN', 'SUPERVISOR', 'SUPERADMIN'] },
  { href: '/ai-agent', label: 'AI assistant', icon: Sparkles, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/knowledge', label: 'Knowledge', icon: BookOpen, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/campaigns', label: 'Outbound', icon: PhoneOutgoing, roles: ['ADMIN', 'SUPERVISOR'] },
  // Agents get this one: a telecaller is an agent, and manual dialling is the
  // only outbound action that is theirs rather than an admin's.
  { href: '/telecaller', label: 'Manual dial', icon: PhoneCall, roles: ['ADMIN', 'SUPERVISOR', 'AGENT'] },
  { href: '/simulator', label: 'Simulator', icon: FlaskConical, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN', 'SUPERVISOR'] },
] as const;

/** Tenant pages need a centre in context; only /superadmin does not. */
const PLATFORM_ONLY_PATHS = ['/superadmin'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
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

  const me = roster.data?.find((a) => a.id === user.id);
  const myStatus: AgentStatus = me?.status ?? 'OFFLINE';
  const statusStyle = AGENT_STATUS_STYLE[myStatus];
  const nav = NAV.filter((n) => {
    if (!(n.roles as readonly string[]).includes(user.role)) return false;
    // A centre's pages are only reachable from inside that centre. On the
    // platform page they would render another tenant's data or nothing at all,
    // so the operator gets exactly one item until they pick a centre.
    if (isOperator && n.href !== '/superadmin') return insideCentre;
    return true;
  });

  return (
    // h-dvh + overflow-hidden, not min-h-dvh: the shell is exactly the viewport
    // and only <main> scrolls. With min-h-dvh a long page grew the flex row, so
    // the sidebar scrolled away with the content and nav was lost.
    <div className="flex h-dvh overflow-hidden">
      {/* A tenant's brand follows whoever's data is on screen: their own for
          staff, the viewed centre's for an operator, the platform's otherwise. */}
      <TenantTheme
        preset={isOperator ? (insideCentre ? viewedOrg?.themePreset : null) : user.orgThemePreset}
        tokens={isOperator ? (insideCentre ? viewedOrg?.themeTokens : null) : user.orgThemeTokens}
      />
      {/* sidebar — pinned; never scrolls with the page */}
      <aside className="hidden h-dvh w-56 shrink-0 flex-col overflow-hidden border-r border-border bg-card md:flex">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Headphones className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{PLATFORM_NAME}</p>
            {/* Whose data you are looking at, which for an operator is nobody's
                until they enter a centre. */}
            <p className="truncate text-[11px] text-muted-foreground">
              {isOperator ? 'Platform operator' : (user.orgName ?? 'Contact centre')}
            </p>
          </div>
        </div>

        {/* min-h-0 lets this shrink inside the flex column so the identity block
            below stays pinned; the links scroll internally only if they must. */}
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                // For an operator, going back to the list is how you leave a
                // centre — so the click that navigates is the click that drops
                // its scope and cached data.
                onClick={href === '/superadmin' && insideCentre ? leaveCentre : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition',
                  active
                    ? 'bg-brand-soft font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
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
              disabled={
                setPresence.isPending || myStatus === 'ON_CALL' || myStatus === 'WRAPUP'
              }
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
              <p className="mt-1 text-[11px] text-muted-foreground/70">Finish the call to change status.</p>
            )}
          </div>
        </div>
      </aside>

      {/* mobile nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-card py-1.5 md:hidden">
        {nav.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]',
                active ? 'text-primary' : 'text-muted-foreground',
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
          <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs backdrop-blur">
            <span className="flex min-w-0 items-center gap-2 text-amber-900 dark:text-amber-200">
              <Eye className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">
                Viewing <strong className="font-semibold">{viewedOrg?.name ?? 'a client centre'}</strong>{' '}
                as a platform operator — read-only.
              </span>
            </span>
            <button
              onClick={() => {
                leaveCentre();
                router.push('/superadmin');
              }}
              className="shrink-0 rounded-md border border-amber-500/40 px-2 py-1 font-medium text-amber-900 transition hover:bg-amber-500/20 dark:text-amber-100"
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
