'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, PhoneIncoming, Inbox, BarChart3 } from 'lucide-react';
import { Eyebrow, Rail, SignalTriangle } from '@hire-stella/ui';
import { PlatformMark } from '@/components/platform-mark';
import { homeFor, useSession } from '@/components/providers';
import { Button, Input, Spinner } from '@/components/composites';
import { PLATFORM_NAME, PLATFORM_TAGLINE } from '@/lib/platform';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * What the product does, in the three lines someone will actually read.
 *
 * Every one of these is a surface this deployment really has — containment and
 * escalation on Live ops, voice and WhatsApp in the one Inbox, and the numbers
 * on Analytics. A sign-in page that promises something the next screen cannot
 * show is worse than a bare one.
 */
const PROOF = [
  {
    icon: PhoneIncoming,
    title: 'AI answers first',
    body: 'It handles what it can and hands the rest to a person, with the context attached.',
  },
  {
    icon: Inbox,
    title: 'One inbox',
    body: 'Voice and WhatsApp in a single thread per customer, inbound and outbound alike.',
  },
  {
    icon: BarChart3,
    title: 'Measured, not guessed',
    body: 'Containment, SLA, abandonment and the agent hours the AI actually saved.',
  },
];

export default function LoginPage() {
  const { login, user, loading } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // A platform operator has no live board of their own to land on.
    if (user) router.replace(homeFor(user));
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
    <main className="hs-app grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/*
        The brand half, and deliberately dark in both themes.

        It is a fixed surface rather than a themed one because it is the first
        thing a client sees on a link someone sent them: it should look the
        same in the screenshot as it does on their screen, whichever theme
        their browser happens to prefer. The form half still follows the theme,
        which is the half they interact with.
      */}
      <section
        data-hs-theme="dark"
        className="hs-hero-base hs-grain relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between"
      >
        {/* HireStella's hero atmosphere (two blooms over near-black) plus one Rail — the
            brand's incomplete frame — instead of a stock texture. */}
        <Rail width={14} className="pointer-events-none absolute top-0 right-16 h-72" />

        <div className="relative">
          <PlatformMark onDark />
        </div>

        <div className="relative max-w-md">
          <Eyebrow marker tone="muted">
            {PLATFORM_TAGLINE}
          </Eyebrow>
          <h2 className="mt-4 text-[2.6rem] leading-[1.04] font-bold tracking-[-0.032em] text-balance">
            A contact centre that answers before anyone picks up.
          </h2>
          <ul className="mt-9 space-y-5">
            {PROOF.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                  <Icon className="size-[18px]" strokeWidth={1.5} aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-0.5 block max-w-[38ch] text-[13px] leading-relaxed text-[var(--hs-text-muted)]">
                    {body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-[11px] tracking-[0.08em] text-[var(--hs-text-subtle)] uppercase">
          <SignalTriangle size={8} /> © {new Date().getFullYear()} {PLATFORM_NAME}
        </p>
      </section>

      {/* The form half. */}
      <section className="flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          {/* The mark rides along on narrow screens, where the brand panel is
              gone and the page would otherwise open on an unlabelled form. */}
          <div className="lg:hidden">
            <PlatformMark />
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm py-10">
            <h1 className="text-[1.75rem] leading-tight font-bold tracking-[-0.025em]">Sign in</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Use the account your operator set up for this centre.
            </p>

            <form onSubmit={submit} className="mt-7">
              <label className="block text-xs font-medium text-muted-foreground">
                Email
                <Input
                  className="mt-1.5"
                  type="email"
                  autoComplete="username"
                  placeholder="you@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="mt-4 block text-xs font-medium text-muted-foreground">
                Password
                <Input
                  className="mt-1.5"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="mt-6 w-full"
                loading={busy}
              >
                Sign in <ArrowRight className="size-4" aria-hidden />
              </Button>
            </form>

            <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
              Trouble signing in? Your platform operator can reset the account.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
