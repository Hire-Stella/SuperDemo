'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { OrgSummary } from '@superdemo/contracts';
import { api } from '@/lib/api';
import { Button, Card, Input } from '@/components/composites';

/**
 * Which Dograh workflows' calls are imported into this centre's Inbox and
 * Analytics — see apps/api/src/integrations/dograh/dograh-sync.service.ts.
 *
 * Workflows are fetched by id wherever on Dograh they live, so moving one to
 * another Dograh organisation only needs its new id here. Operator-only, like
 * the rest of the Voice dialog: the ids are other clients' too.
 */
export function DograhImport({ org }: { org: OrgSummary }) {
  const queryClient = useQueryClient();
  const [ids, setIds] = useState(org.dograhWorkflowIds.join(', '));

  const parsed = ids
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  const valid = parsed.every((n) => Number.isInteger(n) && n > 0);
  const unchanged = parsed.join(',') === org.dograhWorkflowIds.join(',');

  const save = useMutation({
    mutationFn: (dograhWorkflowIds: number[]) =>
      api.put(`/platform/orgs/${org.id}`, { dograhWorkflowIds }),
    onSuccess: (_res, saved) => {
      void queryClient.invalidateQueries({ queryKey: ['platform-orgs'] });
      toast.success(
        saved.length
          ? `Importing calls from workflow ${saved.join(', ')} — new calls arrive within a minute`
          : org.dograhOrgId
            ? `Importing every workflow of Dograh organisation ${org.dograhOrgId}`
            : 'Call import turned off',
      );
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Card
      className="mt-3"
      title="Call import"
      subtitle="Dograh workflows whose calls appear in this centre's Inbox, Analytics and Live ops"
      contentClassName="p-4"
    >
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(parsed);
        }}
      >
        <Input
          aria-label="Workflow IDs"
          className="h-8 w-56 text-xs"
          placeholder="e.g. 331, 332"
          value={ids}
          onChange={(e) => setIds(e.target.value)}
        />
        <Button
          type="submit"
          className="h-8 text-xs"
          disabled={!valid || unchanged || save.isPending}
        >
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </form>
      <p className="mt-2 max-w-prose text-[11px] leading-relaxed text-muted-foreground">
        {!valid
          ? 'Workflow IDs are whole numbers, separated by commas.'
          : parsed.length
            ? 'Found by ID on any Dograh account, so a workflow moved to another account only needs its new ID here.'
            : org.dograhOrgId
              ? `Empty imports every workflow of Dograh organisation ${org.dograhOrgId}.`
              : 'Empty means nothing is imported.'}
      </p>
    </Card>
  );
}
