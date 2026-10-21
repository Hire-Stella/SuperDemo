import { afterEach, describe, expect, it, vi } from 'vitest';
import { DograhClient, FAREWELL_PHRASES } from './dograh.client';

type Node = { id: string; type: string; data: Record<string, unknown> };
type Edge = { source: string; target: string; data: { condition: string } };

async function buildGraph() {
  let written: { nodes: Node[]; edges: Edge[] } | undefined;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: { method: string; body?: string }) => {
      if (init.method === 'PUT' && init.body) {
        written = JSON.parse(init.body).workflow_definition;
      }
      return new Response(JSON.stringify({ status: 'published', is_valid: true }), { status: 200 });
    }),
  );
  const client = new DograhClient('https://dograh.invalid', 'test-key');
  await client.buildStageGraph(1, {
    businessName: 'Acme',
    agentName: 'Ava',
    overallGoal: 'Help callers.',
    facts: 'Open 9 to 5.',
    greeting: 'Hello',
    stages: [
      { name: 'Pricing', purpose: 'Answer pricing.', routeWhen: 'they ask about price' },
      { name: 'Booking', purpose: 'Book visits.', routeWhen: 'they want to book' },
    ],
  });
  return written!;
}

afterEach(() => vi.unstubAllGlobals());

describe('buildStageGraph farewell routing', () => {
  it('routes every non-end node to End Call on a farewell', async () => {
    const { nodes, edges } = await buildGraph();
    const end = nodes.find((n) => n.type === 'endCall')!;
    for (const n of nodes.filter((n) => n.type === 'startCall' || n.type === 'agentNode')) {
      const toEnd = edges.find((e) => e.source === n.id && e.target === end.id);
      expect(toEnd, `node ${n.id} has no edge to End Call`).toBeDefined();
      expect(toEnd!.data.condition).toContain('goodbye');
      expect(toEnd!.data.condition).toContain(FAREWELL_PHRASES);
    }
  });

  it('tells the global prompt to end on a farewell', async () => {
    const { nodes } = await buildGraph();
    const global = nodes.find((n) => n.type === 'globalNode')!;
    expect(global.data.prompt as string).toMatch(/## Ending the call[\s\S]*goodbye[\s\S]*End Call/);
  });

  it('does not let the closing line be interrupted', async () => {
    const { nodes } = await buildGraph();
    const end = nodes.find((n) => n.type === 'endCall')!;
    expect(end.data.allow_interrupt).toBe(false);
    expect(end.data.is_end).toBe(true);
  });
});
