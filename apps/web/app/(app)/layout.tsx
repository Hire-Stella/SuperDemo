import { Providers } from '@/components/providers';
import { AppShell } from '@/components/app-shell';

/**
 * The authenticated shell.
 *
 * Thin, and a server component, for one structural reason: the shell itself
 * calls `useSession`, and a layout cannot provide a context it consumes. So the
 * session and query providers are mounted here and the shell — which is the
 * client component with the sidebar, the softphone and the org switcher — sits
 * inside them.
 *
 * Mounted here rather than in the root layout so that tenant landing pages,
 * which share that root, do not carry the dashboard's session machinery. They
 * were otherwise firing an authentication refresh at a stranger's browser and
 * logging a 401 on a client's marketing page.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
