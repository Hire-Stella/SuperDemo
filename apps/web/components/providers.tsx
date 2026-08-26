'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useRouter } from 'next/navigation';
import type { LoginOutput, SessionUser } from '@fit-ai/contracts';
import { api, getViewingOrg, setAccessToken, setViewingOrg } from '@/lib/api';
import { connectSocket, disconnectSocket, type AppSocket } from '@/lib/socket';

/* ------------------------------- session ---------------------------------- */

interface SessionValue {
  user: SessionUser | null;
  loading: boolean;
  socket: AppSocket | null;
  /** Set only for a platform operator inspecting one centre. */
  viewingOrgId: string | null;
  viewOrg: (orgId: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/** Where a role lands after signing in. */
export const homeFor = (user: SessionUser): string =>
  user.role === 'SUPERADMIN' ? '/superadmin' : '/';

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <Providers>');
  return ctx;
}

/** Convenience for pages that require a user — the shell guarantees one. */
export function useUser(): SessionUser {
  const { user } = useSession();
  if (!user) throw new Error('useUser called outside an authenticated route');
  return user;
}

function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<AppSocket | null>(null);
  // Read lazily rather than in an effect: the first render already needs it to
  // decide whether an operator is inside a centre or looking at the list.
  const [viewingOrgId, setViewingOrgId] = useState<string | null>(() => getViewingOrg());
  const router = useRouter();
  const heartbeat = useRef<ReturnType<typeof setInterval> | null>(null);

  const viewOrg = useCallback((orgId: string | null) => {
    setViewingOrg(orgId);
    setViewingOrgId(orgId);
  }, []);

  const attachSocket = useCallback(() => {
    const s = connectSocket();

    s.on('system.notice', ({ level, message }) => {
      if (level === 'error') toast.error(message);
      else if (level === 'warn') toast.warning(message);
      else toast.info(message);
    });

    // The server marks an agent offline without a heartbeat, so a hung tab stops
    // receiving call offers. 30s against a 90s stale window leaves headroom for
    // two missed beats.
    heartbeat.current = setInterval(() => s.emit('agent.heartbeat'), 30_000);

    setSocket(s);
  }, []);

  /** Restore a session from the refresh cookie on first load. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${api.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return;
        const body = (await res.json()) as LoginOutput;
        if (cancelled) return;
        setAccessToken(body.accessToken);
        setUser(body.user);
        attachSocket();
      } catch {
        /* no existing session */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attachSocket]);

  useEffect(
    () => () => {
      if (heartbeat.current) clearInterval(heartbeat.current);
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const body = await api.post<LoginOutput>('/auth/login', { email, password });
      setAccessToken(body.accessToken);
      setUser(body.user);
      attachSocket();
      // A fresh sign-in starts outside any centre, even if a previous operator
      // session left one selected on this machine.
      if (body.user.role === 'SUPERADMIN') viewOrg(null);
      router.push(homeFor(body.user));
    },
    [attachSocket, router, viewOrg],
  );

  const logout = useCallback(async () => {
    if (heartbeat.current) clearInterval(heartbeat.current);
    await api.post('/auth/logout').catch(() => undefined);
    disconnectSocket();
    setAccessToken(null);
    setUser(null);
    setSocket(null);
    viewOrg(null);
    router.push('/login');
  }, [router, viewOrg]);

  const value = useMemo(
    () => ({ user, loading, socket, viewingOrgId, viewOrg, login, logout }),
    [user, loading, socket, viewingOrgId, viewOrg, login, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/* -------------------------------- providers ------------------------------- */

export function Providers({ children }: { children: ReactNode }) {
  // One client per mount. WebSocket events drive invalidation, so polling is
  // off by default and only used where a socket event doesn't exist.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
            retry: (count, error) => {
              // Don't retry auth or validation failures — they won't get better.
              const status = (error as { status?: number }).status;
              if (status && status < 500) return false;
              return count < 2;
            },
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // Theme changes shouldn't animate every colour on the page at once.
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          {children}
          {/* shadcn's Toaster reads the active theme, so toasts match. */}
          <Toaster position="bottom-right" richColors closeButton />
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
