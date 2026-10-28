import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { AgentsBootstrapService } from './agents-bootstrap.service';

/*
 * The startup fill that replaces `pnpm agents:backfill --apply` after a deploy.
 */

const slot = (over: Record<string, unknown> = {}) => ({
  enabled: true,
  workflowId: null,
  workflowUuid: '',
  workflowName: '',
  embedToken: '',
  ...over,
});

function setup(opts: { locked?: boolean; connected?: Record<string, boolean> } = {}) {
  const settings = [
    // Empty slots, Dograh available → queued.
    { orgId: 'empty', dograhDialers: { inbound: slot(), outbound: slot(), info: slot() } },
    // Already built → skipped.
    {
      orgId: 'built',
      dograhDialers: {
        inbound: slot({ workflowId: 1, workflowUuid: 'a' }),
        outbound: slot({ workflowId: 2, workflowUuid: 'b' }),
        info: slot({ workflowId: 3, workflowUuid: 'c' }),
      },
    },
    // Empty, but nothing to connect to → skipped.
    { orgId: 'unconnected', dograhDialers: { inbound: slot(), outbound: slot({ enabled: false }), info: slot({ enabled: false }) } },
  ];
  const connected = opts.connected ?? { empty: true, built: true, unconnected: false };
  const prisma = {
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<number>) =>
      fn({ $queryRaw: vi.fn(async () => [{ locked: opts.locked ?? true }]) }),
    ),
    setting: { findMany: vi.fn(async () => settings) },
  };
  const tenants = { runAs: vi.fn(async (_org: unknown, _actor: unknown, fn: () => unknown) => fn()) };
  const dograh = { view: vi.fn(async (orgId: string) => ({ connected: connected[orgId] ?? false })) };
  const enrichment = { enqueueBuildAgents: vi.fn(async () => undefined) };
  const svc = new AgentsBootstrapService(prisma as never, tenants as never, dograh as never, enrichment as never);
  return { svc, enrichment, prisma };
}

describe('AgentsBootstrapService', () => {
  it('queues only centres with empty switched-on slots and a Dograh that resolves', async () => {
    const { svc, enrichment } = setup();
    await expect(svc.run()).resolves.toBe(1);
    expect(enrichment.enqueueBuildAgents).toHaveBeenCalledTimes(1);
    expect(enrichment.enqueueBuildAgents).toHaveBeenCalledWith('empty', ['inbound', 'outbound', 'info']);
  });

  it('does nothing when another process holds the lock', async () => {
    const { svc, enrichment } = setup({ locked: false });
    await expect(svc.run()).resolves.toBe(0);
    expect(enrichment.enqueueBuildAgents).not.toHaveBeenCalled();
  });

  it('never throws, even if the database is unavailable', async () => {
    const { svc, prisma } = setup();
    prisma.$transaction.mockRejectedValueOnce(new Error('connection refused'));
    await expect(svc.run()).resolves.toBe(0);
  });
});
