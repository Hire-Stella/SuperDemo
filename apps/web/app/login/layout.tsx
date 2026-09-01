import { Providers } from '@/components/providers';

/**
 * Sign-in needs the session provider — it is what performs the login and holds
 * the resulting token — but none of the app shell. Its own layout rather than
 * the root's, so public pages are not dragged into the same tree.
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
