'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { categoryLabel, type KnowledgeDocDto, type Skill } from '@fit-ai/contracts';
import { api } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { useUser } from '@/components/providers';
import { Badge, Button, Card, MockNotice, SkeletonRows, Table, Td, Th } from '@/components/composites';

export default function KnowledgePage() {
  // Category names are per-vertical: a clinic's "Appointments" is the same
  // routing slot as an institute's "Courses & admissions".
  const user = useUser();
  const query = useQuery({
    queryKey: ['knowledge'],
    queryFn: () => api.get<KnowledgeDocDto[]>('/knowledge'),
  });

  const byCategory = (query.data ?? []).reduce<Record<string, KnowledgeDocDto[]>>((acc, d) => {
    (acc[d.category] ??= []).push(d);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <BookOpen className="size-5 text-primary" aria-hidden /> Knowledge base
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Everything the assistant is allowed to say. It answers from these documents and nothing
            else — which is why it cannot invent a fee.
          </p>
        </div>
        <Link href="/ai-agent">
          <Button variant="secondary">Test retrieval</Button>
        </Link>
      </header>

      <div className="mb-4">
        <MockNotice>
          Course names, categories and contact details are from fitiedu.com and are real. Fees,
          durations and intake dates are <strong>placeholders</strong> — replace them with your
          actual figures before any customer-facing use. The assistant is configured to hedge on
          price and defer to admissions for the exact amount.
        </MockNotice>
      </div>

      {query.isLoading ? (
        <Card><SkeletonRows rows={8} cols={3} /></Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byCategory).map(([category, docs]) => (
            <Card
              key={category}
              title={categoryLabel(user.orgIndustry, category as Skill)}
              subtitle={`${docs.length} document${docs.length === 1 ? '' : 's'}`}
            >
              <Table>
                <thead>
                  <tr>
                    <Th>Title</Th>
                    <Th>Source</Th>
                    <Th className="text-right">Chunks</Th>
                    <Th className="text-right">Updated</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {docs.map((d) => (
                    <tr key={d.id} className="transition hover:bg-muted">
                      <Td className="font-medium">{d.title}</Td>
                      <Td><Badge className="text-[10px]">{d.source}</Badge></Td>
                      <Td className="tnum text-right text-xs">{d.chunkCount}</Td>
                      <Td className="text-right text-xs text-muted-foreground">{dateTime(d.updatedAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
