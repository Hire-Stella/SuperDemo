'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Headphones, ArrowRight } from 'lucide-react';
import { useSession } from '@/components/providers';
import { Button, Input, Spinner } from '@/components/ui';

/** Seeded accounts, so a demo doesn't stall on "what was the password?". */
const DEMO_ACCOUNTS = [
  { email: 'layla@fitiedu.com', role: 'Admin', note: 'settings, numbers, AI config' },
  { email: 'omar@fitiedu.com', role: 'Supervisor', note: 'live ops, analytics' },
  { email: 'mariam@fitiedu.com', role: 'Agent', note: 'softphone, receives calls' },
];

export default function LoginPage() {
  const { login, user, loading } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('layla@fitiedu.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  if (loading) return <Spinner label="Restoring session…" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-brand-fg">
            <Headphones className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">FIT-AI Contact Centre</p>
            <p className="text-xs text-muted">FIT Institute · Dubai</p>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-card border border-border bg-surface p-5">
          <h1 className="text-base font-semibold">Sign in</h1>

          <label className="mt-4 block text-xs font-medium text-muted">
            Email
            <Input
              className="mt-1"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="mt-3 block text-xs font-medium text-muted">
            Password
            <Input
              className="mt-1"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" className="mt-4 w-full" loading={busy}>
            Sign in <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>

        <div className="mt-4 rounded-card border border-border bg-surface-2 p-4">
          <p className="text-xs font-semibold text-muted">Seeded accounts (password: Password123!)</p>
          <ul className="mt-2 space-y-1.5">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email}>
                <button
                  onClick={() => setEmail(a.email)}
                  className="w-full rounded-lg px-2 py-1.5 text-left transition hover:bg-surface"
                >
                  <span className="text-xs font-medium">{a.role}</span>
                  <span className="ml-1.5 text-xs text-muted">{a.email}</span>
                  <span className="block text-[11px] text-faint">{a.note}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
