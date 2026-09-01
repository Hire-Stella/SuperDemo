import Link from 'next/link';
import { PLATFORM_NAME } from '@/lib/platform';

/**
 * Served for an unknown handle, a suspended centre, or a page not yet published
 * — the API returns the same 404 for all three on purpose, so this page cannot
 * hint at which. Deliberately plain: it is not any client's brand, so it should
 * not pretend to be.
 */
export default function SiteNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 py-16">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {PLATFORM_NAME}
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">
          There is no page at this address
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The link may be mistyped, or the page may not be published yet. If you were looking for a
          business, try searching for their name.
        </p>
        <Link
          href="/login"
          className="mt-7 inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-medium transition hover:bg-accent"
        >
          Staff sign in
        </Link>
      </div>
    </main>
  );
}
