import type { Metadata } from 'next';
import { Geist, Montserrat, Poppins } from 'next/font/google';
import './globals.css';
import { ThemeShell } from '@/components/providers';
import { PLATFORM_NAME, PLATFORM_TAGLINE } from '@/lib/platform';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
// HireStella type (dashboard + sign-in). Only the brand-book weights: Poppins 600/700/800, Montserrat 400/500/600.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-hs-display',
  display: 'swap',
});
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-hs-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${PLATFORM_NAME} · ${PLATFORM_TAGLINE}`,
  description:
    `${PLATFORM_NAME} runs AI-first contact centres for clinics, restaurants, institutes and ` +
    'more — inbound AI voice with warm handoff to human agents, one isolated centre per client.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning is required by next-themes: it sets the `class`
    // on <html> before React hydrates, which would otherwise mismatch.
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(geist.variable, poppins.variable, montserrat.variable)}
    >
      <body className="font-sans">
        {/*
          Theme only. Session and query providers are mounted per route group —
          see app/(app)/layout.tsx — so a tenant's public landing page, which
          shares this root, does not carry the dashboard's session machinery.
        */}
        <ThemeShell>{children}</ThemeShell>
      </body>
    </html>
  );
}
