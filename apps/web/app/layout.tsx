import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'FIT-AI · Contact Centre',
  description:
    'AI-first contact centre for FIT Institute — inbound AI voice with warm handoff to human agents, unified with Bitrix24.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning is required by next-themes: it sets the `class`
    // on <html> before React hydrates, which would otherwise mismatch.
    <html lang="en" suppressHydrationWarning className={cn(geist.variable)}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
