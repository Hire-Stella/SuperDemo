import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'FIT-AI · Contact Centre',
  description:
    'AI-first contact centre for FIT Institute — inbound AI voice with warm handoff to human agents, unified with Bitrix24.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
