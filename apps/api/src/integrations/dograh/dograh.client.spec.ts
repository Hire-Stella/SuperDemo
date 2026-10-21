import { afterEach, describe, expect, it, vi } from 'vitest';
import { DograhClient, FAREWELL_PHRASES } from './dograh.client';
import {
  BOOKING_CONFIRM_RULE,
  INTERRUPTION_SECTION,
  VOICE_STYLE_SECTION,
} from './dograh-prompts';

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

describe('buildStageGraph voice rules', () => {
  it('carries the concise-reply and interruption rules next to the farewell rule', async () => {
    const { nodes } = await buildGraph();
    const prompt = nodes.find((n) => n.type === 'globalNode')!.data.prompt as string;
    expect(prompt).toContain(VOICE_STYLE_SECTION);
    expect(prompt).toContain(INTERRUPTION_SECTION);
    expect(prompt).toMatch(/## Ending the call[\s\S]*goodbye[\s\S]*End Call/);
    expect(prompt).not.toMatch(/two or three sentences/);
    expect(prompt).toContain('Open 9 to 5.');
    expect(prompt).toMatch(/Never invent a price/);
    expect(prompt.match(/## How you speak/g)).toHaveLength(1);
  });

  it('keeps start and stage nodes interruptible and the closing line not', async () => {
    const { nodes } = await buildGraph();
    for (const n of nodes.filter((n) => n.type === 'startCall' || n.type === 'agentNode')) {
      expect(n.data.allow_interrupt).toBe(true);
    }
    expect(nodes.find((n) => n.type === 'endCall')!.data.allow_interrupt).toBe(false);
  });
});

describe('injectFacts on a Dograh-generated graph', () => {
  const opts = { businessName: 'Acme', agentName: 'Ava', facts: 'Tuition is AED 4,500 per term.' };
  const generated = () => ({
    nodes: [
      { id: '0', type: 'globalNode', data: { prompt: 'You are Sam, an assistant.', allow_interrupt: false } },
      { id: '1', type: 'startCall', data: { prompt: 'Introduce yourself as Sam.', allow_interrupt: false } },
      { id: '2', type: 'agentNode', data: { prompt: 'Help.' } },
      { id: '3', type: 'endCall', data: { prompt: 'Say goodbye.', allow_interrupt: false, is_end: true } },
    ],
    edges: [],
  });

  function stubWrites() {
    const puts: any[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: { method: string; body?: string }) => {
        if (init.method === 'PUT' && init.body) puts.push(JSON.parse(init.body).workflow_definition);
        return new Response(JSON.stringify({ status: 'published', is_valid: true }), { status: 200 });
      }),
    );
    return puts;
  }
  const client = () => new DograhClient('https://dograh.invalid', 'test-key');
  const byType = (d: any, t: string) => d.nodes.find((n: any) => n.type === t);

  it('makes start and agent nodes interruptible, leaves End Call and the global node alone', async () => {
    const puts = stubWrites();
    await client().injectFacts(1, generated(), opts);
    const d = puts[0];
    expect(byType(d, 'startCall').data.allow_interrupt).toBe(true);
    expect(byType(d, 'agentNode').data.allow_interrupt).toBe(true);
    expect(byType(d, 'endCall').data.allow_interrupt).toBe(false);
    expect(byType(d, 'endCall').data.is_end).toBe(true);
    expect(byType(d, 'endCall').data.prompt).toBe('Say goodbye.');
    expect(byType(d, 'globalNode').data.allow_interrupt).toBe(false);
  });

  it('writes the concise and interruption rules once, with the facts and the agent name', async () => {
    const puts = stubWrites();
    await client().injectFacts(1, generated(), opts);
    const prompt = byType(puts[0], 'globalNode').data.prompt as string;
    expect(prompt).toContain('You are Ava');
    expect(prompt).toContain(VOICE_STYLE_SECTION);
    expect(prompt).toContain(INTERRUPTION_SECTION);
    expect(prompt).toContain('Tuition is AED 4,500 per term.');
    expect(prompt).toMatch(/Never invent a price/);
  });

  it('adds nothing and writes nothing when run again on the result', async () => {
    const puts = stubWrites();
    const def = generated();
    await client().injectFacts(1, def, opts);
    const first = JSON.stringify(def);
    const again = await client().injectFacts(1, def, opts);
    expect(again.nodesTouched).toBe(0);
    expect(puts).toHaveLength(1);
    expect(JSON.stringify(def)).toBe(first);
    expect((byType(def, 'globalNode').data.prompt as string).match(/## How you speak/g)).toHaveLength(1);
  });
});

describe('interruption and booking safeguards', () => {
  it('says an interruption is neither a confirmation nor a request to end, but a farewell still ends', () => {
    expect(INTERRUPTION_SECTION).toMatch(/stop at once and listen/);
    expect(INTERRUPTION_SECTION).toMatch(/not a request to end the call, and not a confirmation/);
    expect(INTERRUPTION_SECTION).toMatch(/Never end the call, book, cancel or confirm/);
    expect(INTERRUPTION_SECTION).toMatch(/farewell .* still ends the call/);
  });

  it('books only after the caller clearly agrees to the read-back time', () => {
    const text = BOOKING_CONFIRM_RULE.join(' ');
    expect(text).toMatch(/only after the caller has clearly agreed/);
    expect(text).toMatch(/interrupt/);
    expect(text).toMatch(/do not book/);
  });

  it('states brevity without giving up accuracy', () => {
    expect(VOICE_STYLE_SECTION).toMatch(/one or two short sentences/);
    expect(VOICE_STYLE_SECTION).toMatch(/Answer only the question asked/);
    expect(VOICE_STYLE_SECTION).toMatch(/one short question, never two/);
    expect(VOICE_STYLE_SECTION).toMatch(/several parts/);
    expect(VOICE_STYLE_SECTION).toMatch(/short summary first/);
    expect(VOICE_STYLE_SECTION).toMatch(/Brevity never overrides accuracy/);
  });
});
