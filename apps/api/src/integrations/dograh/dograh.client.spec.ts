import { afterEach, describe, expect, it, vi } from 'vitest';
import { DograhClient, FAREWELL_PHRASES, TURN_START_DEFAULTS } from './dograh.client';

type Node = { id: string; type: string; data: Record<string, unknown> };
type Edge = { source: string; target: string; data: { condition: string } };

async function buildGraph(existingConfig?: Record<string, unknown>) {
  let written: { nodes: Node[]; edges: Edge[] } | undefined;
  let putBody: Record<string, unknown> | undefined;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: { method: string; body?: string }) => {
      if (init.method === 'PUT' && init.body) {
        putBody = JSON.parse(init.body);
        written = putBody!.workflow_definition as typeof written;
      }
      if (init.method === 'GET' && url.includes('/workflow/fetch/1')) {
        return new Response(JSON.stringify({ id: 1, workflow_configurations: existingConfig }), {
          status: 200,
        });
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
  return { ...written!, putBody: putBody! };
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

describe('buildStageGraph latency', () => {
  it('lets the start node answer questions instead of routing them', async () => {
    const { nodes } = await buildGraph();
    const start = nodes.find((n) => n.type === 'startCall')!;
    const prompt = start.data.prompt as string;
    expect(prompt).toMatch(/answer it here/);
    expect(prompt).toMatch(/Never route just to answer a question/);
    expect(prompt).not.toMatch(/Do not try to answer/);
  });

  it('lets every stage answer other questions instead of routing them', async () => {
    const { nodes } = await buildGraph();
    for (const n of nodes.filter((n) => n.type === 'agentNode')) {
      expect(n.data.prompt as string).toMatch(/Never route just to answer a question/);
    }
  });

  it('routes between stages only to act, never just to answer', async () => {
    const { nodes, edges } = await buildGraph();
    const end = nodes.find((n) => n.type === 'endCall')!;
    const routes = edges.filter((e) => e.target !== end.id);
    expect(routes.length).toBeGreaterThan(0);
    for (const e of routes) {
      expect(e.data.condition).toContain('wants to go ahead with this');
      expect(e.data.condition).toContain('is not a reason to switch');
    }
  });

  it('writes the min_words turn-start standard and keeps the rest of the configuration', async () => {
    const { putBody } = await buildGraph({
      turn_start_strategy: 'default',
      turn_start_min_words: 3,
      max_call_duration: 300,
      smart_turn_stop_secs: 2,
    });
    expect(putBody.workflow_configurations).toEqual({
      max_call_duration: 300,
      smart_turn_stop_secs: 2,
      ...TURN_START_DEFAULTS,
    });
  });

  it('leaves the configuration alone when it cannot be read', async () => {
    const { putBody } = await buildGraph(undefined);
    expect(putBody).not.toHaveProperty('workflow_configurations');
    expect(putBody).toHaveProperty('workflow_definition');
  });
});
