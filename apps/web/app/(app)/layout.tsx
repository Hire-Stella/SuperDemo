'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  BookOpen,
  Headphones,
  Inbox,
  LogOut,
  PhoneCall,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { AGENT_STATUS_STYLE } from '@/lib/format';
import type { AgentStatus, AgentSummary } from '@fit-ai/contracts';
import { api } from '@/lib/api';
import { useSession } from '@/components/providers';
import { Softphone } from '@/components/softphone';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, Select, Spinner, cn } from '@/components/composites';

const NAV = [
  { href: '/', label: 'Live ops', icon: Activity, roles: ['ADMIN', 'SUPERVISOR', 'AGENT'] },
  { href: '/conversations', label: 'Inbox', icon: Inbox, roles: ['ADMIN', 'SUPERVISOR', 'AGENT'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/agents', label: 'Agents', icon: Users, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/ai-agent', label: 'AI assistant', icon: Sparkles, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/knowledge', label: 'Knowledge', icon: BookOpen, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/simulator', label: 'Simulator', icon: PhoneCall, roles: ['ADMIN', 'SUPERVISOR'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN', 'SUPERVISOR'] },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, socket } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  /* Presence control — an agent must be able to go on break from anywhere. */
  const roster = useQuery({
    queryKey: ['presence-roster'],
    queryFn: () => api.get<AgentSummary[]>('/presence/roster'),
    enabled: Boolean(user),
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

  const me = roster.data?.find((a) => a.id === user.id);
  const myStatus: AgentStatus = me?.status ?? 'OFFLINE';
  const statusStyle = AGENT_STATUS_STYLE[myStatus];
  const nav = NAV.filter((n) => (n.roles as readonly string[]).includes(user.role));

  return (
    // h-dvh + overflow-hidden, not min-h-dvh: the shell is exactly the viewport
    // and only <main> scrolls. With min-h-dvh a long page grew the flex row, so
    // the sidebar scrolled away with the content and nav was lost.
    <div className="flex h-dvh overflow-hidden">
      {/* sidebar — pinned; never scrolls with the page */}
      <aside className="hidden h-dvh w-56 shrink-0 flex-col overflow-hidden border-r border-border bg-card md:flex">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Headphones className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">FIT-AI</p>
            <p className="truncate text-[11px] text-muted-foreground">FIT Institute</p>
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

          <div className="mt-2.5">
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
      <main className="min-w-0 flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>

      {/* Docked so an agent can browse while on a call. */}
      <Softphone />
    </div>
  );
}
