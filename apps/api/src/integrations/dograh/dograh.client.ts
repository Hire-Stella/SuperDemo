import { Logger } from '@nestjs/common';
import { DOGRAH_API_PREFIX, type DograhWorkflowRow } from '@superdemo/contracts';

/**
 * A thin, typed client for one Dograh host.
 *
 * Deliberately not a Nest provider: it is constructed per (host, key) pair by
 * DograhService, which resolves those per centre. Keeping it a plain class means
 * the credential is a constructor argument rather than ambient state, so there
 * is no path where a request for centre A reaches Dograh with centre B's key.
 *
 * Every method fails with a message a person can act on. A landing page's
 * "connect" button is used by a client's admin, not by us, and "Dograh said 401"
 * is the difference between them fixing their key and them filing a bug.
 */
export class DograhClient {
  private readonly log = new Logger(DograhClient.name);

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  /** Dograh authenticates with X-API-Key; `authorization` is for its own UI. */
  private headers(): Record<string, string> {
    return { 'content-type': 'application/json', 'x-api-key': this.apiKey };
  }

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/+$/, '')}${DOGRAH_API_PREFIX}${path}`;
  }

  /**
   * Ten seconds, not the default none.
   *
   * A Dograh host that has gone away must not hold a website-editor request
   * open until the browser gives up — the editor is where someone discovers
   * their voice platform is down, so it has to return and say so.
   */
  private async call<T>(
    path: string,
    init: { method: string; body?: unknown; timeoutMs?: number } = { method: 'GET' },
  ): Promise<T> {
    const res = await fetch(this.url(path), {
      method: init.method,
      headers: this.headers(),
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      // Ten seconds suits a read. Generating a workflow is a model building a
      // call graph and needs far longer, so it passes its own.
      signal: AbortSignal.timeout(init.timeoutMs ?? 10_000),
    }).catch((e: unknown) => {
      const reason = e instanceof Error ? e.message : String(e);
      throw new Error(`Could not reach ${this.baseUrl} — ${reason}`);
    });

    if (!res.ok) {
      // Dograh returns FastAPI's {"detail": "..."} on every error path we have
      // seen, including 401 and the 404 for an unknown embed token.
      const detail = await res
        .json()
        .then((b: unknown) =>
          b && typeof b === 'object' && 'detail' in b ? String((b as { detail: unknown }).detail) : '',
        )
        .catch(() => '');
      throw new Error(
        detail
          ? `Dograh refused the request (${res.status}): ${detail}`
          : `Dograh refused the request (${res.status} ${res.statusText})`,
      );
    }
    return (await res.json()) as T;
  }

  /** Who the key belongs to. The cheapest proof a credential is live. */
  async whoAmI(): Promise<{ id?: number; email?: string }> {
    return this.call('/auth/me');
  }

  /**
   * The workflows this key can see.
   *
   * `/workflow/fetch` returns a bare array of {id, name, status, total_runs}.
   * Shapes are still read defensively — this is the client's own platform and
   * they upgrade it on their schedule, not ours, so a renamed field should cost
   * the editor a workflow name and not the whole page.
   */
  async listWorkflows(): Promise<DograhWorkflowRow[]> {
    const raw = await this.call<unknown>('/workflow/fetch');
    const rows = Array.isArray(raw)
      ? raw
      : raw && typeof raw === 'object' && Array.isArray((raw as { workflows?: unknown[] }).workflows)
        ? ((raw as { workflows: unknown[] }).workflows ?? [])
        : [];
    return rows.flatMap((r): DograhWorkflowRow[] => {
      if (!r || typeof r !== 'object') return [];
      const o = r as Record<string, unknown>;
      const id = Number(o.id ?? o.workflow_id);
      if (!Number.isFinite(id)) return [];
      return [
        {
          id,
          name: String(o.name ?? o.title ?? `Workflow ${id}`),
          status: String(o.status ?? 'unknown'),
          totalRuns: Number.isFinite(Number(o.total_runs)) ? Number(o.total_runs) : 0,
        },
      ];
    });
  }

  /** {total, active, archived}. Used to prove a key works and say how much it sees. */
  async workflowCount(): Promise<{ total: number; active: number; archived: number }> {
    return this.call('/workflow/count');
  }

  /**
   * Mint (or replace) the public embed token for a workflow.
   *
   * `allowed_domains` is the entire security story for a token that ships in
   * public HTML, so it is required here rather than optional — a token with no
   * domain list is one anyone can lift into their own page and spend the
   * client's voice minutes with.
   */
  /**
   * `settings` keys are camelCase, and that is not a style choice.
   *
   * Dograh's API stores this object verbatim — send `button_text` and it saves
   * `button_text` and reports it back happily — but the widget bundle reads
   * `configData.settings?.buttonText`. So a snake_case key is accepted, stored,
   * echoed, and silently ignored at render time, which is the worst shape a
   * config mistake can take. Verified against the shipped bundle rather than
   * inferred from the rest of their API.
   */
  async createEmbedToken(
    workflowId: number,
    allowedDomains: string[],
    settings?: Record<string, unknown>,
  ): Promise<{ token: string; embed_script?: string; allowed_domains?: string[] | null }> {
    if (allowedDomains.length === 0) {
      throw new Error('Refusing to mint an embed token with no allowed domains');
    }
    return this.call(`/workflow/${workflowId}/embed-token`, {
      method: 'POST',
      body: {
        allowed_domains: allowedDomains,
        expires_in_days: 365,
        ...(settings ? { settings } : {}),
      },
    });
  }

  /**
   * Build a workflow from a natural-language brief.
   *
   * Dograh generates the node graph and the prompts itself — we hand it prose
   * about the business and it returns a working agent. The response carries the
   * numeric id but *not* the uuid, which the public call endpoints need, so
   * `workflowUuid` looks that up separately.
   *
   * Slow: this is a model building a call flow, so it can take the better part
   * of a minute. Given its own timeout rather than the class default for that
   * reason.
   */
  async createWorkflowFromTemplate(params: {
    callType: 'inbound' | 'outbound';
    useCase: string;
    activityDescription: string;
  }): Promise<{
    id: number;
    name: string;
    status: string;
    /** The generated node graph, which is what documents get attached to. */
    workflow_definition?: Record<string, unknown>;
  }> {
    return this.call('/workflow/create/template', {
      method: 'POST',
      body: {
        call_type: params.callType,
        use_case: params.useCase,
        activity_description: params.activityDescription,
      },
      timeoutMs: 120_000,
    });
  }

  /**
   * The uuid for a workflow id.
   *
   * `/workflow/fetch` is the only endpoint that returns it — the create
   * response omits it and there is no per-workflow read that includes it. So a
   * list-and-find, which is one request either way.
   */
  async workflowUuid(workflowId: number): Promise<string | null> {
    const raw = await this.call<unknown>('/workflow/fetch');
    const rows = Array.isArray(raw) ? raw : [];
    for (const r of rows) {
      if (r && typeof r === 'object') {
        const o = r as Record<string, unknown>;
        if (Number(o.id) === workflowId) {
          const uuid = o.workflow_uuid;
          return typeof uuid === 'string' && uuid ? uuid : null;
        }
      }
    }
    return null;
  }

  /**
   * Duplicate a workflow.
   *
   * Used to give chat its own workflow, because one workflow can only hold one
   * embed token and therefore one widget mode. The copy shares the original's
   * nodes and prompts, so both modes are genuinely the same agent.
   */
  async duplicateWorkflow(workflowId: number): Promise<{ id: number; name: string }> {
    return this.call(`/workflow/${workflowId}/duplicate`, {
      method: 'POST',
      timeoutMs: 60_000,
    });
  }

  /**
   * Put a document in Dograh's knowledge base and wait for it to be indexed.
   *
   * Three steps, all theirs: ask for a presigned S3 URL, PUT the bytes to it,
   * then tell Dograh to process what landed. The upload goes straight to S3 and
   * not through their API, so it does not carry our API key.
   *
   * Returns the document uuid, which is what a workflow node references.
   */
  async uploadKnowledge(
    filename: string,
    text: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ documentUuid: string; chunks: number; status: string }> {
    const signed = await this.call<{
      upload_url: string;
      document_uuid: string;
      s3_key: string;
    }>('/knowledge-base/upload-url', {
      method: 'POST',
      body: {
        filename,
        mime_type: 'text/plain',
        ...(metadata ? { custom_metadata: metadata } : {}),
      },
    });

    /*
     * The field is called `s3_key`, but the storage is not always S3.
     *
     * On this deployment the signed URL points at
     * `*.blob.core.windows.net` — Azure Blob — which rejects a PUT that omits
     * `x-ms-blob-type` with `MissingRequiredHeader`, a 400 that says nothing
     * about the header unless you read the XML body. The name in their API is
     * a leftover, so the header is added by looking at the host we were
     * actually given rather than by trusting the field name.
     */
    const target = new URL(signed.upload_url);
    const isAzureBlob = target.hostname.endsWith('.blob.core.windows.net');

    const put = await fetch(signed.upload_url, {
      method: 'PUT',
      headers: {
        // Must match the mime type the URL was signed for, or the signature
        // fails rather than the content.
        'content-type': 'text/plain',
        ...(isAzureBlob ? { 'x-ms-blob-type': 'BlockBlob' } : {}),
      },
      body: text,
      signal: AbortSignal.timeout(60_000),
    }).catch((e: unknown) => {
      throw new Error(`Upload to Dograh's storage failed — ${e instanceof Error ? e.message : e}`);
    });
    if (!put.ok) {
      // The body carries the real reason — Azure and S3 both explain
      // themselves in XML and neither puts it in the status line.
      const why = await put.text().catch(() => '');
      const code = /<Code>([^<]+)<\/Code>/.exec(why)?.[1];
      throw new Error(
        `Upload to Dograh's storage was refused (${put.status}${code ? `: ${code}` : ''})`,
      );
    }

    const processed = await this.call<{
      document_uuid: string;
      processing_status: string;
      total_chunks: number;
    }>('/knowledge-base/process-document', {
      method: 'POST',
      body: {
        document_uuid: signed.document_uuid,
        s3_key: signed.s3_key,
        // Chunked, not full_document: a website is many small facts and the
        // agent should retrieve the relevant paragraph, not be handed the lot.
        retrieval_mode: 'chunked',
      },
      timeoutMs: 120_000,
    });

    return {
      documentUuid: processed.document_uuid || signed.document_uuid,
      chunks: processed.total_chunks ?? 0,
      status: processed.processing_status ?? 'unknown',
    };
  }

  /**
   * Attach documents to every node of a workflow that can retrieve.
   *
   * `document_uuids` lives on each node's `data`, so retrieval is scoped per
   * node rather than per workflow — and, importantly, per *document* rather
   * than across the whole organisation. That matters here because every
   * tenant's agent lives in one Dograh org: without this, one centre's website
   * would be retrievable by another centre's agent.
   *
   * Only `agentNode`s get it, which is how Dograh's own configured RAG agents
   * are built: there, every `agentNode` carries `document_uuids` and
   * `globalNode`, `startCall` and `endCall` omit the field entirely. A freshly
   * generated workflow has it on no node at all, so this creates the field
   * rather than only updating it — an earlier version only touched nodes that
   * already had it, uploaded the document, and attached it to nothing.
   */
  async attachDocuments(
    workflowId: number,
    definition: Record<string, unknown>,
    documentUuids: string[],
  ): Promise<{ nodesTouched: number }> {
    const nodes = Array.isArray(definition.nodes) ? definition.nodes : [];
    let nodesTouched = 0;
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const n = node as { type?: unknown; data?: Record<string, unknown> };
      if (n.type !== 'agentNode' || !n.data) continue;
      n.data.document_uuids = documentUuids;
      nodesTouched++;
    }
    if (nodesTouched === 0) return { nodesTouched: 0 };

    await this.call(`/workflow/${workflowId}`, {
      method: 'PUT',
      body: { workflow_definition: definition },
      timeoutMs: 60_000,
    });

    /*
     * Ask Dograh whether what we just wrote is coherent.
     *
     * We are editing a node graph their editor normally owns, so their own
     * validator is the only honest check that the edit did not break the agent.
     * A failure is logged rather than thrown: the document is attached and the
     * agent runs, and a validation warning is something to look at, not a
     * reason to discard a working workflow.
     */
    const invalid = await this.call<{ is_valid?: boolean; errors?: unknown[] }>(
      `/workflow/${workflowId}/validate`,
      { method: 'POST', body: {}, timeoutMs: 30_000 },
    )
      .then((v) => (v.is_valid === false ? (v.errors ?? []) : null))
      .catch(() => null);
    if (invalid) {
      this.log.warn(
        `workflow ${workflowId} reports invalid after attaching documents: ${JSON.stringify(invalid).slice(0, 300)}`,
      );
    }

    return { nodesTouched };
  }

  /**
   * Write the business's facts into the agent's own prompt.
   *
   * Preferred over the knowledge base, and not as a workaround. Retrieval is
   * broken on this deployment — `POST /knowledge-base/search` answers 500
   * "Failed to search chunks" for *their* documents as well as ours, because
   * `knowledge_base_chunks` does not exist — but even with it fixed, a demo
   * agent that must not misquote a fee is better served by facts it always has
   * than by a vector search that might miss. A page's worth of facts fits in a
   * prompt; a product catalogue would not, and that is when RAG earns its keep.
   *
   * The facts go on the `globalNode`, because every other node carries
   * `add_global_prompt: true` and therefore inherits it — one edit reaches the
   * greeting, the question handling and the close.
   *
   * `agentName` also replaces Dograh's hardcoded "You are Sam", so a client's
   * agent introduces itself as theirs.
   */
  async injectFacts(
    workflowId: number,
    definition: Record<string, unknown>,
    opts: { businessName: string; agentName: string; facts: string },
  ): Promise<{ nodesTouched: number }> {
    const nodes = Array.isArray(definition.nodes) ? definition.nodes : [];
    const block = [
      '',
      '',
      `## VERIFIED FACTS ABOUT ${opts.businessName}`,
      '',
      'These come from the business\'s own website. Answer from them.',
      '',
      '- If a caller asks something these facts do not cover, say you will have a',
      '  colleague confirm and offer to take their number. Never invent a price, a',
      '  date, an address, a qualification or an availability.',
      '- Quote figures exactly as written here.',
      '',
      opts.facts,
    ].join('\n');

    let nodesTouched = 0;
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const n = node as { type?: unknown; data?: Record<string, unknown> };
      if (!n.data || typeof n.data.prompt !== 'string') continue;

      // Dograh names every generated agent Sam. Replaced everywhere it appears
      // so the greeting and the persona cannot disagree with each other.
      let prompt = n.data.prompt.replace(/\bYou are Sam\b/g, `You are ${opts.agentName}`);
      prompt = prompt.replace(/\bIntroduce yourself as Sam\b/g, `Introduce yourself as ${opts.agentName}`);

      if (n.type === 'globalNode' && !prompt.includes('## VERIFIED FACTS')) {
        prompt += block;
      }
      if (prompt !== n.data.prompt) {
        n.data.prompt = prompt;
        nodesTouched++;
      }
    }
    if (nodesTouched === 0) return { nodesTouched: 0 };

    await this.call(`/workflow/${workflowId}`, {
      method: 'PUT',
      body: { workflow_definition: definition },
      timeoutMs: 60_000,
    });

    const pub = await this.publishWorkflow(workflowId);
    if (!pub.published) {
      this.log.warn(`workflow ${workflowId} facts written but NOT published (${pub.detail})`);
    }

    const invalid = await this.call<{ is_valid?: boolean; errors?: unknown[] }>(
      `/workflow/${workflowId}/validate`,
      { method: 'POST', body: {}, timeoutMs: 30_000 },
    )
      .then((v) => (v.is_valid === false ? (v.errors ?? []) : null))
      .catch(() => null);
    if (invalid) {
      this.log.warn(
        `workflow ${workflowId} reports invalid after writing facts: ${JSON.stringify(invalid).slice(0, 300)}`,
      );
    }
    return { nodesTouched };
  }

  /**
   * Replace a generated workflow's graph with a routed, multi-stage one.
   *
   * `create/template` always returns the same four nodes — greet, one
   * catch-all agent node, global, end — no matter how the brief is written; I
   * asked it for six named stages and got four nodes back. Dograh's own
   * hand-built agents are nine nodes with 38 edges between them, so a
   * multi-stage flow is something to construct, not request.
   *
   * The shape mirrors theirs exactly, because it is the only worked example of
   * a graph their runtime is known to accept:
   *
   *   id 0        globalNode  — persona, rules and the business's facts
   *   id 1        startCall   — greeting, then routes on the caller's need
   *   id 2..n+1   agentNode   — one per stage
   *   id n+2      endCall
   *
   * Edges are hub-and-spoke plus full cross-linking: start reaches every
   * stage, every stage reaches every other stage and the end. That is what
   * lets a caller change subject mid-call — the thing a single catch-all node
   * cannot do — and it is how their MFIS agent is wired.
   *
   * Ends with their own `/validate`, since we are writing a graph their editor
   * normally owns.
   */
  async buildStageGraph(
    workflowId: number,
    opts: {
      businessName: string;
      agentName: string;
      /** Persona and rules, minus the facts block. */
      overallGoal: string;
      facts: string;
      greeting: string;
      stages: { name: string; purpose: string; routeWhen: string }[];
    },
  ): Promise<{ nodes: number; edges: number; valid: boolean }> {
    const { agentName, businessName } = opts;
    const stages = opts.stages.slice(0, 6);

    const globalPrompt = [
      '# OVERALL GOAL',
      '',
      `You are ${agentName}, the AI assistant for ${businessName}.`,
      '',
      opts.overallGoal,
      '',
      '## How you speak',
      '- Keep replies short — two or three sentences, and stop.',
      '- Your words are read aloud by a speech engine, so no markdown, no lists,',
      '  no special characters. Say numbers as words a person would say.',
      '- One question at a time. Never stack two.',
      '',
      '## What you must not do',
      '- Never invent a price, a date, an address, a qualification or an availability.',
      '  If the facts below do not cover it, say you will have a colleague confirm and',
      '  offer to take their number.',
      '- Never claim to be a human. If asked, say plainly that you are an AI assistant.',
      '',
      `## VERIFIED FACTS ABOUT ${businessName}`,
      '',
      "These come from the business's own website. They are your only source of truth.",
      '',
      opts.facts,
    ].join('\n');

    const startId = '1';
    const endId = String(stages.length + 2);

    type Node = { id: string; type: string; position: { x: number; y: number }; data: Record<string, unknown> };
    const nodes: Node[] = [
      {
        id: '0',
        type: 'globalNode',
        position: { x: -900, y: 900 },
        data: { prompt: globalPrompt, name: `Global Node — ${businessName}`, allow_interrupt: true },
      },
      {
        id: startId,
        type: 'startCall',
        position: { x: 205, y: 60 },
        data: {
          name: 'Greeting & Routing',
          prompt: [
            '# MAIN ACTION POINT AT THIS STAGE',
            '',
            'Greet the caller, find out in one question what they need, then route.',
            '',
            '- Do not try to answer their question here. Route to the stage that owns it.',
            '- If what they want is still unclear after one question, ask one more, then route',
            '  to the closest stage rather than looping.',
          ].join('\n'),
          allow_interrupt: true,
          add_global_prompt: true,
          is_start: true,
          delayed_start: false,
          delayed_start_duration: 2,
          greeting_type: 'text',
          greeting: opts.greeting,
          extraction_enabled: false,
          extraction_prompt: '',
          extraction_variables: [],
        },
      },
    ];

    stages.forEach((st, i) => {
      nodes.push({
        id: String(i + 2),
        type: 'agentNode',
        // Spread horizontally so the canvas is readable if someone opens it.
        position: { x: -600 + i * 420, y: 620 },
        data: {
          name: st.name,
          prompt: [
            '# MAIN ACTION POINT AT THIS STAGE',
            '',
            st.purpose,
            '',
            '## Staying in your lane',
            '- Answer only this subject. If the caller moves to something else, route to the',
            '  stage that owns it rather than answering outside your remit.',
            '- Everything you state must come from the verified facts. No exceptions.',
          ].join('\n'),
          allow_interrupt: true,
          add_global_prompt: true,
          extraction_enabled: true,
          extraction_prompt: `Record what the caller wanted regarding ${st.name.toLowerCase()} and what they were told.`,
          extraction_variables: [
            { name: 'caller_need', type: 'string', prompt: 'What the caller asked for, in a few words.' },
            { name: 'outcome', type: 'string', prompt: 'What they were told, or what was promised next.' },
          ],
        },
      });
    });

    nodes.push({
      id: endId,
      type: 'endCall',
      position: { x: 205, y: 1500 },
      data: {
        name: 'End Call',
        prompt: [
          '# MAIN ACTION POINT AT THIS STAGE',
          '',
          'The conversation is finished. Confirm anything you promised, thank them by name if',
          'you have it, and close warmly in one sentence.',
        ].join('\n'),
        allow_interrupt: true,
        add_global_prompt: false,
        is_end: true,
        extraction_enabled: false,
        extraction_prompt: '',
        extraction_variables: [],
      },
    });

    const stageIds = stages.map((_, i) => String(i + 2));
    const edges: Record<string, unknown>[] = [];
    const link = (source: string, target: string, condition: string, label: string) =>
      edges.push({
        id: `${source}-${target}`,
        source,
        target,
        type: 'custom',
        animated: true,
        data: { condition, label },
      });

    // start -> every stage, on that stage's own routing condition
    stages.forEach((st, i) =>
      link(startId, stageIds[i]!, `Choose this pathway when ${st.routeWhen}.`, st.name),
    );
    link(startId, endId, 'Choose this pathway when the caller says they have finished, or rings off.', 'Done');

    // stage -> peers, so a caller can change subject; and stage -> end
    stageIds.forEach((from, i) => {
      stageIds.forEach((to, j) => {
        if (i === j) return;
        link(from, to, `Choose this pathway when ${stages[j]!.routeWhen}.`, stages[j]!.name);
      });
      link(from, endId, 'Choose this pathway when the caller has what they need, or wants to end the call.', 'Done');
    });

    await this.call(`/workflow/${workflowId}`, {
      method: 'PUT',
      body: {
        workflow_definition: { nodes, edges, viewport: { x: 0, y: 0, zoom: 0.55 } },
      },
      timeoutMs: 60_000,
    });

    // Without this the write is a draft nobody serves — see publishWorkflow.
    const pub = await this.publishWorkflow(workflowId);
    if (!pub.published) {
      this.log.warn(
        `workflow ${workflowId} graph written but NOT published (${pub.detail}) — ` +
          'the live agent is still the generated one',
      );
    }

    const valid = await this.call<{ is_valid?: boolean; errors?: unknown[] }>(
      `/workflow/${workflowId}/validate`,
      { method: 'POST', body: {}, timeoutMs: 30_000 },
    )
      .then((v) => v.is_valid !== false)
      .catch(() => true);
    if (!valid) {
      this.log.warn(`workflow ${workflowId} reports invalid after building its stage graph`);
    }

    return { nodes: nodes.length, edges: edges.length, valid };
  }

  /**
   * Publish the current draft, so the live agent is the one we just wrote.
   *
   * This is the step whose absence made every generated agent introduce itself
   * as Sam. `PUT /workflow/{id}` does not go live — it creates version n+1 as
   * a draft, and the widgets keep serving the published version, which is
   * Dograh's original four-node graph with their hardcoded name. The prompts
   * read back correctly from `/versions` the whole time, which is exactly why
   * it took a real conversation to notice.
   *
   * "No draft to publish" is success, not failure: it means the workflow was
   * already live as written.
   */
  async publishWorkflow(workflowId: number): Promise<{ published: boolean; detail?: string }> {
    try {
      const r = await this.call<{ version_number?: number; status?: string }>(
        `/workflow/${workflowId}/publish`,
        { method: 'POST', body: {}, timeoutMs: 60_000 },
      );
      return { published: r.status === 'published', detail: `v${r.version_number ?? '?'}` };
    } catch (e) {
      const why = e instanceof Error ? e.message : String(e);
      if (/no draft to publish/i.test(why)) return { published: true, detail: 'already live' };
      return { published: false, detail: why };
    }
  }

  /**
   * Ring a number with a workflow, for a demo.
   *
   * The `/public/agent/test/...` route runs the latest *draft*, which is what
   * an operator wants when showing someone the agent they just generated —
   * including edits made on the Dograh side that were never published.
   */
  async demoCall(
    workflowUuid: string,
    phoneE164: string,
    context?: Record<string, unknown>,
  ): Promise<{ status: string; workflow_run_id: number; workflow_run_name: string }> {
    return this.call(`/public/agent/test/workflow/${workflowUuid}`, {
      method: 'POST',
      body: {
        phone_number: phoneE164,
        ...(context && Object.keys(context).length ? { initial_context: context } : {}),
      },
      timeoutMs: 30_000,
    });
  }

  /** Ask Dograh to ring a number with a workflow. Its telephony, its DID. */
  async initiateCall(workflowId: number, phoneE164: string): Promise<{ workflow_run_id?: number }> {
    return this.call('/telephony/initiate-call', {
      method: 'POST',
      body: { workflow_id: workflowId, phone_number: phoneE164 },
    });
  }
}
