import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  DOGRAH_WIDGET_DISABLED,
  DograhPublic,
  dograhOffersCallback,
  DOGRAH_AGENT_NAME,
  DOGRAH_CHAT_BUTTON_TEXT,
  DOGRAH_CHAT_CONTAINER_ID,
  DOGRAH_WIDGET_BUTTON_TEXT,
  dograhSnippetHostMismatch,
  dograhWidgetSrc,
  dograhOffersWidget,
  BLANK_DIALERS,
  DEMO_DIALER_KINDS,
  DEMO_DIALER_LABELS,
  DograhDialers,
  type ApiEnv,
  type DemoCallsView,
  type DemoDialerConfig,
  type DemoDialerKind,
  type SaveDemoDialerInput,
  type ConnectDograhSiteOutput,
  type DograhConnectionView,
  type DograhWidgetDto,
  type DograhWorkflowRow,
  type SaveDograhConnectionInput,
  type TestDograhConnectionOutput,
} from '@superdemo/contracts';
import { Prisma } from '@superdemo/db';
import { ENV } from '../../config/config.module';
import { PrismaService } from '../../prisma/prisma.service';
import { decryptSecret, encryptSecret, fingerprint } from '../../shared/secret-box';
import { DograhClient } from './dograh.client';

/** Nothing stored yet — the shape the editor and the page both start from. */
const EMPTY: DograhPublic = {
  workflowId: null,
  workflowName: '',
  workflowUuid: '',
  embedToken: '',
  chatEmbedToken: '',
  chatWorkflowId: null,
  chatEnabled: true,
  embedScript: '',
  allowedDomains: [],
  callMode: 'both',
};

/**
 * Which Dograh a given centre's landing page talks to.
 *
 * Resolution mirrors CrmResolver deliberately: a centre's own row wins, and a
 * centre that has saved nothing inherits the deployment's DOGRAH_BASE_URL and
 * DOGRAH_API_KEY. That is what lets one key in .env light up every seeded
 * tenant for a demo, while a real client's key stays scoped to their row.
 */
@Injectable()
export class DograhService {
  private readonly log = new Logger(DograhService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  private parsePublic(raw: Prisma.JsonValue | null): DograhPublic {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...EMPTY };
    const parsed = DograhPublic.safeParse(raw);
    if (!parsed.success) {
      // A row written by a newer version, or by hand. Falling back to empty is
      // better than throwing: an unreadable config must not 500 the website
      // editor, which is the one place someone can fix it.
      this.log.warn('Setting.dograhPublic did not parse; treating as unconnected');
      return { ...EMPTY };
    }
    return parsed.data;
  }

  private async row(orgId: string) {
    return this.prisma.setting.findFirst({
      where: { orgId },
      select: {
        dograhBaseUrl: true,
        dograhPublic: true,
        dograhSecretsEnc: true,
        dograhDialers: true,
        dograhUpdatedAt: true,
      },
    });
  }

  /** The key for this centre, or the deployment's. Null when there is neither. */
  private resolveKey(enc: string | null | undefined): { key: string; inherited: boolean } | null {
    if (enc) {
      if (!this.env.CRM_SECRET_KEY) {
        throw new BadRequestException(
          'CRM_SECRET_KEY is not configured, so this centre’s stored Dograh key cannot be read',
        );
      }
      return { key: decryptSecret(enc, this.env.CRM_SECRET_KEY), inherited: false };
    }
    const fallback = this.env.DOGRAH_API_KEY?.trim();
    return fallback ? { key: fallback, inherited: true } : null;
  }

  private resolveBaseUrl(saved: string | null | undefined): string | null {
    return saved?.trim() || this.env.DOGRAH_BASE_URL?.trim() || null;
  }

  /** A client for this centre, or a clear reason there is none. */
  private async clientFor(orgId: string): Promise<{ client: DograhClient; pub: DograhPublic }> {
    const row = await this.row(orgId);
    const baseUrl = this.resolveBaseUrl(row?.dograhBaseUrl);
    if (!baseUrl) {
      throw new BadRequestException('No Dograh host is configured for this centre');
    }
    const resolved = this.resolveKey(row?.dograhSecretsEnc);
    if (!resolved) {
      throw new BadRequestException(
        'No Dograh API key for this centre — add one, or set DOGRAH_API_KEY for the deployment',
      );
    }
    return { client: new DograhClient(baseUrl, resolved.key), pub: this.parsePublic(row?.dograhPublic ?? null) };
  }

  /** What the website editor renders. Never carries the key. */
  async view(orgId: string): Promise<DograhConnectionView> {
    const row = await this.row(orgId);
    const pub = this.parsePublic(row?.dograhPublic ?? null);
    const baseUrl = this.resolveBaseUrl(row?.dograhBaseUrl);
    let resolved: { key: string; inherited: boolean } | null = null;
    try {
      resolved = this.resolveKey(row?.dograhSecretsEnc);
    } catch {
      // Undecryptable (CRM_SECRET_KEY missing or rotated). The editor should say
      // "no key" and let it be replaced, not fail to load.
      resolved = null;
    }
    return {
      connected: Boolean(baseUrl && resolved && pub.workflowId && pub.embedToken),
      baseUrl,
      hasApiKey: Boolean(resolved),
      inheritedFromDeployment: Boolean(resolved?.inherited),
      workflowId: pub.workflowId,
      workflowName: pub.workflowName || null,
      hasEmbedToken: Boolean(pub.embedToken),
      canDemoCall: Boolean(pub.workflowUuid),
      hasChatToken: Boolean(pub.chatEmbedToken),
      chatEnabled: pub.chatEnabled,
      allowedDomains: pub.allowedDomains,
      callMode: pub.callMode,
      snippetHostWarning: baseUrl
        ? dograhSnippetHostMismatch(pub.embedScript, baseUrl)
        : null,
      updatedAt: row?.dograhUpdatedAt ?? null,
    };
  }

  /**
   * Save the host, optionally a new key, and which workflow the page uses.
   *
   * Changing the workflow clears the embed token: a token is minted against one
   * workflow id, so keeping the old one would leave the page quietly talking to
   * the previous agent. The editor re-mints as its next step.
   */
  async save(orgId: string, input: SaveDograhConnectionInput): Promise<DograhConnectionView> {
    const row = await this.row(orgId);
    const pub = this.parsePublic(row?.dograhPublic ?? null);

    let enc = row?.dograhSecretsEnc ?? null;
    if (input.apiKey) {
      if (!this.env.CRM_SECRET_KEY) {
        throw new BadRequestException(
          'CRM_SECRET_KEY must be set before a Dograh key can be stored — it encrypts it at rest',
        );
      }
      enc = encryptSecret(input.apiKey, this.env.CRM_SECRET_KEY);
      this.log.log(`dograh: key stored for org=${orgId} fp=${fingerprint(input.apiKey)}`);
    }

    const nextWorkflowId = input.workflowId === undefined ? pub.workflowId : input.workflowId;
    const workflowChanged = nextWorkflowId !== pub.workflowId;

    const next: DograhPublic = {
      ...pub,
      workflowId: nextWorkflowId,
      workflowName: workflowChanged ? '' : pub.workflowName,
      workflowUuid: workflowChanged ? '' : pub.workflowUuid,
      embedToken: workflowChanged ? '' : pub.embedToken,
      chatEmbedToken: workflowChanged ? '' : pub.chatEmbedToken,
      // A new workflow needs a new twin; the old one no longer matches it.
      chatWorkflowId: workflowChanged ? null : pub.chatWorkflowId,
      chatEnabled: input.chatEnabled ?? pub.chatEnabled,
      embedScript: workflowChanged ? '' : pub.embedScript,
      allowedDomains: workflowChanged ? [] : pub.allowedDomains,
      callMode: input.callMode ?? pub.callMode,
    };

    await this.prisma.setting.update({
      where: { orgId },
      data: {
        dograhBaseUrl: input.baseUrl,
        dograhPublic: next as unknown as Prisma.InputJsonValue,
        dograhSecretsEnc: enc,
        dograhUpdatedAt: new Date(),
      },
    });
    return this.view(orgId);
  }

  /** Prove the stored credential works, and say how much it can see. */
  async test(orgId: string): Promise<TestDograhConnectionOutput> {
    const row = await this.row(orgId);
    const baseUrl = this.resolveBaseUrl(row?.dograhBaseUrl) ?? '';
    try {
      const { client } = await this.clientFor(orgId);
      const me = await client.whoAmI();
      const count = await client.workflowCount().catch(() => null);
      return {
        ok: true,
        baseUrl,
        workflowCount: count?.total ?? null,
        detail: me.email
          ? `Connected as ${me.email}${count ? ` — ${count.total} workflow(s)` : ''}`
          : `Connected${count ? ` — ${count.total} workflow(s)` : ''}`,
      };
    } catch (e) {
      return {
        ok: false,
        baseUrl,
        workflowCount: null,
        detail: e instanceof Error ? e.message : 'Could not reach Dograh',
      };
    }
  }

  /**
   * 502 rather than 500 when Dograh says no.
   *
   * Nothing here is broken: we are a gateway to the client's own host and it
   * refused. A bare "Internal server error" would send whoever is configuring
   * this looking for a crash in our code instead of at the key they just
   * pasted, which is the exact failure DriverErrorFilter was written to stop.
   */
  async workflows(orgId: string): Promise<DograhWorkflowRow[]> {
    const { client } = await this.clientFor(orgId);
    try {
      return await client.listWorkflows();
    } catch (e) {
      throw new BadGatewayException(
        e instanceof Error ? e.message : 'Dograh did not return a workflow list',
      );
    }
  }

  /**
   * Mint the page's embed token, locked to the domains the page is served from.
   *
   * The domain list is derived here rather than typed by an admin: it is the
   * only thing standing between a public token and someone else's page, and a
   * field someone can leave blank is a field someone will leave blank.
   */
  async connectSite(orgId: string, workflowName?: string): Promise<ConnectDograhSiteOutput> {
    const { client, pub } = await this.clientFor(orgId);
    if (!pub.workflowId) {
      throw new BadRequestException('Choose a Dograh workflow before connecting the page');
    }

    const domains = this.allowedDomains();
    try {
      // Same branding and the same voice+chat pair as the generated path — a
      // hand-picked agent should not be a lesser citizen than a generated one.
      const pair = await this.mintPair(client, pub.workflowId, domains, pub.chatWorkflowId);

      /**
       * Store the workflow's name alongside the token.
       *
       * So the editor can say *which* agent is connected without a second
       * authenticated round-trip to Dograh — which matters precisely when that
       * round-trip is what is failing. A name we cannot look up is left as it
       * was rather than blanked; it is a label, and losing it must not fail a
       * mint that otherwise succeeded.
       */
      const named =
        workflowName ??
        (await client
          .listWorkflows()
          .then((ws) => ws.find((w) => w.id === pub.workflowId)?.name)
          .catch(() => undefined)) ??
        pub.workflowName;

      /*
       * Fill in the uuid while we are here.
       *
       * A workflow picked by hand in the editor only ever had its numeric id
       * stored, and the public call route keys on the uuid — so without this a
       * manually-connected agent could serve the landing page but never take a
       * demo call, which reads as the demo-call feature being broken rather
       * than as a missing lookup.
       */
      const uuid =
        pub.workflowUuid ||
        (await client.workflowUuid(pub.workflowId).catch(() => null)) ||
        '';

      await this.prisma.setting.update({
        where: { orgId },
        data: {
          dograhPublic: {
            ...pub,
            workflowName: named,
            embedToken: pair.voice.token,
            chatEmbedToken: pair.chat?.token ?? '',
            chatWorkflowId: pair.chat?.workflowId ?? null,
            workflowUuid: uuid,
            embedScript: pair.voice.script,
            allowedDomains: domains,
          } as unknown as Prisma.InputJsonValue,
          dograhUpdatedAt: new Date(),
        },
      });
      return {
        ok: true,
        detail: pair.chat
          ? `The page can now open a voice call or a chat with workflow ${pub.workflowId}`
          : `The page can now open a voice call with workflow ${pub.workflowId} — chat was refused`,
        hasEmbedToken: true,
        allowedDomains: domains,
      };
    } catch (e) {
      return {
        ok: false,
        detail: e instanceof Error ? e.message : 'Could not mint an embed token',
        hasEmbedToken: Boolean(pub.embedToken),
        allowedDomains: pub.allowedDomains,
      };
    }
  }

  /**
   * The hosts a landing page is actually served from.
   *
   * WEB_ORIGIN is where the pages live. Localhost is included only when
   * WEB_ORIGIN itself is local, so a production token is never valid on a
   * developer's machine.
   */
  private allowedDomains(): string[] {
    const out = new Set<string>();
    try {
      const host = new URL(this.env.WEB_ORIGIN).hostname;
      out.add(host);
      if (host === 'localhost' || host === '127.0.0.1') {
        out.add('localhost');
        out.add('127.0.0.1');
      }
    } catch {
      /* WEB_ORIGIN is url-validated by the env schema, so this cannot happen. */
    }
    return [...out];
  }

  /** What a public page is handed. Safe by construction: no key, ever. */
  async widgetFor(orgId: string): Promise<DograhWidgetDto> {
    const row = await this.row(orgId);
    const pub = this.parsePublic(row?.dograhPublic ?? null);
    const baseUrl = this.resolveBaseUrl(row?.dograhBaseUrl);
    const usable = Boolean(baseUrl && pub.embedToken && pub.workflowId);
    if (!usable || !baseUrl) return DOGRAH_WIDGET_DISABLED;

    const scriptSrc = dograhWidgetSrc(baseUrl, pub.embedToken);
    const chatScriptSrc =
      pub.chatEnabled && pub.chatEmbedToken
        ? dograhWidgetSrc(baseUrl, pub.chatEmbedToken)
        : null;
    return {
      enabled: dograhOffersWidget(pub.callMode) && Boolean(scriptSrc),
      baseUrl,
      embedToken: pub.embedToken,
      scriptSrc,
      chatScriptSrc: dograhOffersWidget(pub.callMode) ? chatScriptSrc : null,
      chatContainerId: DOGRAH_CHAT_CONTAINER_ID,
      callbackViaDograh: dograhOffersCallback(pub.callMode),
    };
  }

  /**
   * Mint the page's two tokens: a floating voice bubble and an inline chat panel.
   *
   * Both point at the same workflow. They have to be separate tokens because
   * the widget resolves its mode from `settings.widgetType` when it loads, so
   * one token can be voice or chat but never both — and the settings keys are
   * camelCase, which their API will accept in any case and then silently
   * ignore (see createEmbedToken).
   *
   * Chat is inline rather than a second bubble: the bundle only knows one
   * position, so two floating widgets would sit on top of each other.
   */
  private async mintPair(
    client: DograhClient,
    workflowId: number,
    domains: string[],
    existingChatWorkflowId: number | null,
  ): Promise<{
    voice: { token: string; script: string };
    chat: { token: string; workflowId: number } | null;
  }> {
    const voice = await client.createEmbedToken(workflowId, domains, {
      widgetType: 'voice',
      buttonText: DOGRAH_WIDGET_BUTTON_TEXT,
      callToActionText: 'Click to speak to us now',
    });
    if (!voice.token) throw new Error('Dograh returned no token');

    /*
     * Chat failing does not fail the connect.
     *
     * The voice button is what the page is for; chat is the extra. A Dograh
     * that gave us one and refused the other should leave a working page rather
     * than no page — so this branch swallows and logs.
     */
    const chat = await (async () => {
      // Reuse the twin if we already made one. Duplicating per re-issue would
      // leave a workflow behind on the client's Dograh for every button click.
      const twinId =
        existingChatWorkflowId ?? (await client.duplicateWorkflow(workflowId)).id;
      /*
       * The twin is published too.
       *
       * A duplicate carries the graph but arrives as its own draft, so without
       * this the chat widget served Dograh's generated agent — introducing
       * itself as Sam — while voice served ours. Two widgets, one prompt, and
       * only one of them right is worse than neither.
       */
      const twinPub = await client.publishWorkflow(twinId);
      if (!twinPub.published) {
        this.log.warn(`dograh: chat twin ${twinId} not published (${twinPub.detail})`);
      }
      const minted = await client.createEmbedToken(twinId, domains, {
        widgetType: 'chat',
        buttonText: DOGRAH_CHAT_BUTTON_TEXT,
        callToActionText: 'Click to start chatting',
        embedMode: 'inline',
        containerId: DOGRAH_CHAT_CONTAINER_ID,
      });
      if (!minted.token) throw new Error('Dograh returned no chat token');
      return { token: minted.token, workflowId: twinId };
    })().catch((e: unknown) => {
      this.log.warn(
        `dograh: chat not provisioned for workflow ${workflowId} — ${e instanceof Error ? e.message : e}`,
      );
      return null;
    });

    return {
      voice: { token: voice.token, script: voice.embed_script ?? '' },
      chat,
    };
  }

  /**
   * Generate a voice agent for this centre and wire the landing page to it.
   *
   * Called by enrichment, from a website the operator pasted. Three steps that
   * have to happen in order, and each one is reported separately because they
   * fail for different reasons: Dograh builds the workflow (a model building a
   * call graph — slow, and the step most likely to time out), we look up its
   * uuid (needed for the demo call and absent from the create response), then
   * mint the page's embed token.
   *
   * The button says "Talk to Stella" rather than Dograh's default "Start Voice
   * Call", because on a client's own landing page the agent is theirs, not a
   * product feature they are being shown.
   */
  async buildAgentFor(
    orgId: string,
    brief: {
      useCase: string;
      activityDescription: string;
      greeting?: string;
      /** The scraped site, put in Dograh's KB so the agent can answer specifics. */
      /** Facts from the site, written into the agent's prompt. */
      facts?: string;
      /** What the agent calls itself. Never Dograh's hardcoded "Sam". */
      agentName?: string;
      businessName?: string;
      /** One routed stage per thing callers ring about. */
      stages?: { name: string; purpose: string; routeWhen: string }[];
    },
  ): Promise<{ ok: true } | { ok: false; detail: string }> {
    let client: DograhClient;
    let pub: DograhPublic;
    try {
      ({ client, pub } = await this.clientFor(orgId));
    } catch (e) {
      return { ok: false, detail: e instanceof Error ? e.message : 'no Dograh configured' };
    }

    try {
      const created = await client.createWorkflowFromTemplate({
        callType: 'inbound',
        useCase: brief.useCase || 'inbound enquiry handling',
        activityDescription: brief.activityDescription,
      });

      /*
       * Replace the generated skeleton with a routed, multi-stage graph.
       *
       * `create/template` is used for what it is good at — reading a website
       * and working out what the business does — and then its four-node output
       * is rebuilt into one stage per caller intent, cross-linked so somebody
       * can change subject mid-call. See buildStageGraph for why this is
       * constructed rather than asked for.
       *
       * The facts go on the global node, which every stage inherits, so one
       * write reaches the greeting, every stage and the close.
       *
       * Best-effort: a failure here leaves the four-node agent Dograh
       * generated, which still works. Better a plainer agent than none.
       */
      if (brief.stages?.length && brief.facts) {
        try {
          const built = await client.buildStageGraph(created.id, {
            businessName: brief.businessName ?? 'this business',
            agentName: brief.agentName ?? DOGRAH_AGENT_NAME,
            overallGoal:
              brief.useCase ||
              'Answer whatever the caller needs from the facts you have been given.',
            facts: brief.facts,
            greeting:
              brief.greeting ||
              `Thank you for calling ${brief.businessName ?? 'us'}, this is ${
                brief.agentName ?? DOGRAH_AGENT_NAME
              } — how can I help you today?`,
            stages: brief.stages,
          });
          this.log.log(
            `dograh: workflow ${created.id} rebuilt as ${built.nodes} nodes / ${built.edges} edges ` +
              `(${brief.stages.length} stages, valid=${built.valid})`,
          );
        } catch (e) {
          this.log.warn(
            `dograh: workflow ${created.id} kept its generated graph — ` +
              `${e instanceof Error ? e.message : e}`,
          );
        }
      } else if (brief.facts) {
        // No stages to build from: at least get the facts and the name in.
        try {
          const definition = created.workflow_definition;
          if (definition && typeof definition === 'object') {
            const r = await client.injectFacts(created.id, definition, {
              businessName: brief.businessName ?? 'this business',
              agentName: brief.agentName ?? DOGRAH_AGENT_NAME,
              facts: brief.facts,
            });
            this.log.log(
              `dograh: facts written into ${r.nodesTouched} node(s) of workflow ${created.id}`,
            );
          }
        } catch (e) {
          this.log.warn(
            `dograh: workflow ${created.id} built but facts not written — ` +
              `${e instanceof Error ? e.message : e}`,
          );
        }
      }

      const uuid = await client.workflowUuid(created.id).catch(() => null);

      // Duplicated *after* the documents are attached, so the chat twin
      // inherits them rather than being a copy of the un-sourced agent.
      const domains = this.allowedDomains();
      const pair = await this.mintPair(client, created.id, domains, null);

      const next: DograhPublic = {
        ...pub,
        workflowId: created.id,
        workflowName: created.name,
        workflowUuid: uuid ?? '',
        embedToken: pair.voice.token,
        embedScript: pair.voice.script,
        chatEmbedToken: pair.chat?.token ?? '',
        chatWorkflowId: pair.chat?.workflowId ?? null,
        allowedDomains: domains,
      };
      await this.prisma.setting.update({
        where: { orgId },
        data: {
          dograhPublic: next as unknown as Prisma.InputJsonValue,
          dograhUpdatedAt: new Date(),
        },
      });
      this.log.log(
        `dograh: built workflow ${created.id} ("${created.name}") for org=${orgId}` +
          (uuid ? '' : ' — no uuid returned, so demo calls are unavailable'),
      );
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        detail: e instanceof Error ? e.message : 'Dograh could not build the agent',
      };
    }
  }

  /**
   * Place a demo call: the centre's own agent rings a number an operator typed.
   *
   * Unlike ringVisitor this reports its failure, because somebody is watching a
   * form and waiting to see a phone light up. It is also the one outbound path
   * that bypasses the dialler entirely — no campaign, no pacing, no opt-out
   * list — which is why it is ADMIN-only and rate-limited at the controller.
   */
  /* =========================== demo call dialers =========================== */

  private parseDialers(raw: Prisma.JsonValue | null): DograhDialers {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...BLANK_DIALERS };
    const parsed = DograhDialers.safeParse(raw);
    if (!parsed.success) {
      // Same reasoning as parsePublic: an unreadable config must not 500 the
      // one page where it can be fixed.
      this.log.warn('Setting.dograhDialers did not parse; treating as unconfigured');
      return { ...BLANK_DIALERS };
    }
    return parsed.data;
  }

  /**
   * The three slots, plus whatever is needed to configure them.
   *
   * The workflow list is fetched here rather than by a second request from the
   * page, so a Dograh that is down produces one card saying so instead of three
   * empty pickers and a separate silent failure. It is also why a listing
   * failure is a field rather than a thrown error: the stored config is still
   * worth rendering when Dograh is unreachable.
   */
  async dialersView(orgId: string): Promise<DemoCallsView> {
    const row = await this.row(orgId);
    const baseUrl = this.resolveBaseUrl(row?.dograhBaseUrl);
    const dialers = this.parseDialers(row?.dograhDialers ?? null);

    let key: { key: string; inherited: boolean } | null = null;
    try {
      key = this.resolveKey(row?.dograhSecretsEnc);
    } catch {
      key = null;
    }
    const connected = Boolean(baseUrl && key);

    let workflows: DemoCallsView['workflows'] = [];
    let workflowsError: string | null = null;
    if (connected) {
      try {
        workflows = (await new DograhClient(baseUrl!, key!.key).listWorkflows()).map((w) => ({
          id: w.id,
          name: w.name,
          status: w.status,
        }));
      } catch (e) {
        workflowsError = e instanceof Error ? e.message : 'Dograh did not return a workflow list';
      }
    }

    return {
      dograhConnected: connected,
      baseUrl,
      workflows,
      workflowsError,
      updatedAt: row?.dograhUpdatedAt ?? null,
      dialers: DEMO_DIALER_KINDS.map((kind) => {
        const c = dialers[kind];
        const blockedReason = !connected
          ? 'This centre has no Dograh host or key yet. Connect one on the Website page.'
          : !c.workflowId
            ? 'No agent chosen for this slot.'
            : !c.workflowUuid
              ? 'Dograh did not return a uuid for that agent — choose it again.'
              : !c.enabled
                ? null
                : null;
        return {
          kind,
          ...c,
          ready: connected && Boolean(c.workflowUuid) && c.enabled,
          canWebCall: connected && Boolean(c.workflowId) && c.enabled,
          blockedReason,
        };
      }),
    };
  }

  /**
   * Point one slot at a workflow, or switch it on and off.
   *
   * The uuid is resolved at save time, not at dial time. Dograh only returns it
   * from `/workflow/fetch`, so looking it up per call would add a round trip to
   * every demo — and, worse, would fail at the moment someone is standing in
   * front of a client rather than at the moment they were configuring it.
   */
  async saveDialer(orgId: string, input: SaveDemoDialerInput): Promise<DemoCallsView> {
    const row = await this.row(orgId);
    const dialers = this.parseDialers(row?.dograhDialers ?? null);
    const current = dialers[input.kind];

    let next: DemoDialerConfig = { ...current };

    if (input.workflowId !== undefined) {
      if (input.workflowId === null) {
        next = { ...next, workflowId: null, workflowUuid: '', workflowName: '' };
      } else if (input.workflowId !== current.workflowId) {
        const { client } = await this.clientFor(orgId);
        const [uuid, list] = await Promise.all([
          client.workflowUuid(input.workflowId).catch(() => ''),
          client.listWorkflows().catch(() => [] as Awaited<ReturnType<DograhClient['listWorkflows']>>),
        ]);
        if (!uuid) {
          throw new BadGatewayException(
            `Dograh has no uuid for workflow ${input.workflowId}, so it cannot be dialled. Pick another.`,
          );
        }
        next = {
          ...next,
          workflowId: input.workflowId,
          workflowUuid: uuid,
          workflowName: list.find((w) => w.id === input.workflowId)?.name ?? '',
        };
      }
    }

    if (input.enabled !== undefined) next.enabled = input.enabled;

    await this.prisma.setting.update({
      where: { orgId },
      data: { dograhDialers: { ...dialers, [input.kind]: next } as Prisma.InputJsonValue },
    });

    return this.dialersView(orgId);
  }

  /**
   * The browser-call script for one slot, minting an embed token if needed.
   *
   * ## Why this never re-mints the landing page's token
   *
   * `POST /workflow/{id}/embed-token` is create-or-*update*: one token per
   * workflow. Minting again for a workflow that already has one overwrites its
   * settings, which is how chat once silently turned the voice widget into a
   * chat widget. A demo slot very often points at the same workflow the landing
   * page uses, so this reuses an existing token wherever one exists — the
   * landing page's first, then another slot's — and only mints when the
   * workflow genuinely has none of ours.
   *
   * When it does mint, it mints with exactly the settings `mintPair` uses for
   * voice. Identical settings make a re-mint a no-op in effect rather than a
   * change nobody asked for.
   */
  async webCallScript(
    orgId: string,
    kind: DemoDialerKind,
  ): Promise<{ ok: boolean; detail: string; scriptSrc: string | null }> {
    const row = await this.row(orgId);
    const baseUrl = this.resolveBaseUrl(row?.dograhBaseUrl);
    const dialers = this.parseDialers(row?.dograhDialers ?? null);
    const slot = dialers[kind];
    const label = DEMO_DIALER_LABELS[kind].label.toLowerCase();

    if (!slot.enabled) {
      return { ok: false, detail: `The ${label} dialer is switched off.`, scriptSrc: null };
    }
    if (!slot.workflowId) {
      return { ok: false, detail: `No agent is set for the ${label} dialer yet.`, scriptSrc: null };
    }
    if (!baseUrl) {
      return { ok: false, detail: 'No Dograh host is configured for this centre.', scriptSrc: null };
    }

    const build = (token: string) => {
      const src = dograhWidgetSrc(baseUrl, token);
      return src
        ? { ok: true, detail: 'Ready to talk.', scriptSrc: src }
        : {
            ok: false,
            detail: 'Could not build a widget URL from this centre’s Dograh host.',
            scriptSrc: null,
          };
    };

    if (slot.embedToken) return build(slot.embedToken);

    // The landing page's token, when this slot points at the same agent.
    const pub = this.parsePublic(row?.dograhPublic ?? null);
    let token =
      pub.workflowId === slot.workflowId && pub.embedToken ? pub.embedToken : '';

    // Another slot's, when two slots share an agent.
    if (!token) {
      token =
        DEMO_DIALER_KINDS.map((k) => dialers[k])
          .find((d) => d.workflowId === slot.workflowId && d.embedToken)?.embedToken ?? '';
    }

    if (!token) {
      let client: DograhClient;
      try {
        ({ client } = await this.clientFor(orgId));
      } catch (e) {
        return {
          ok: false,
          detail: e instanceof Error ? e.message : 'no Dograh configured',
          scriptSrc: null,
        };
      }
      try {
        const minted = await client.createEmbedToken(slot.workflowId, this.allowedDomains(), {
          widgetType: 'voice',
          buttonText: DOGRAH_WIDGET_BUTTON_TEXT,
          callToActionText: 'Click to speak to us now',
        });
        if (!minted.token) throw new Error('Dograh returned no token');
        token = minted.token;
      } catch (e) {
        return {
          ok: false,
          detail: e instanceof Error ? e.message : 'Dograh refused to mint an embed token',
          scriptSrc: null,
        };
      }
    }

    await this.prisma.setting.update({
      where: { orgId },
      data: {
        dograhDialers: {
          ...dialers,
          [kind]: { ...slot, embedToken: token },
        } as Prisma.InputJsonValue,
      },
    });

    return build(token);
  }

  /** Ring a number with one slot's agent. */
  async placeDialerCall(
    orgId: string,
    kind: DemoDialerKind,
    phoneE164: string,
    note?: string,
  ): Promise<{ ok: boolean; detail: string; workflowRunId: number | null }> {
    const row = await this.row(orgId);
    const slot = this.parseDialers(row?.dograhDialers ?? null)[kind];

    if (!slot.enabled) {
      return {
        ok: false,
        detail: `The ${DEMO_DIALER_LABELS[kind].label.toLowerCase()} dialer is switched off for this centre.`,
        workflowRunId: null,
      };
    }
    if (!slot.workflowUuid) {
      return {
        ok: false,
        detail: `No agent is set for the ${DEMO_DIALER_LABELS[kind].label.toLowerCase()} dialer yet.`,
        workflowRunId: null,
      };
    }

    let client: DograhClient;
    try {
      ({ client } = await this.clientFor(orgId));
    } catch (e) {
      return {
        ok: false,
        detail: e instanceof Error ? e.message : 'no Dograh configured',
        workflowRunId: null,
      };
    }

    try {
      const run = await client.demoCall(
        slot.workflowUuid,
        phoneE164,
        note ? { note } : undefined,
      );
      this.log.log(`dograh: ${kind} demo call ${run.workflow_run_name} org=${orgId} -> ${phoneE164}`);
      return {
        ok: true,
        detail: `Calling ${phoneE164} now — ${slot.workflowName || 'the agent'} speaks as soon as it is picked up.`,
        workflowRunId: run.workflow_run_id ?? null,
      };
    } catch (e) {
      return {
        ok: false,
        detail: e instanceof Error ? e.message : 'Dograh refused the call',
        workflowRunId: null,
      };
    }
  }

  async demoCall(
    orgId: string,
    phoneE164: string,
    note?: string,
  ): Promise<{ ok: boolean; detail: string; workflowRunId: number | null }> {
    let client: DograhClient;
    let pub: DograhPublic;
    try {
      ({ client, pub } = await this.clientFor(orgId));
    } catch (e) {
      return {
        ok: false,
        detail: e instanceof Error ? e.message : 'no Dograh configured',
        workflowRunId: null,
      };
    }
    if (!pub.workflowUuid) {
      return {
        ok: false,
        detail:
          'This centre has no agent uuid on record, so a call cannot be placed. Re-run the website ' +
          'setup, or pick the agent again in the Voice agent card.',
        workflowRunId: null,
      };
    }
    try {
      const run = await client.demoCall(pub.workflowUuid, phoneE164, note ? { note } : undefined);
      this.log.log(`dograh: demo call ${run.workflow_run_name} org=${orgId} -> ${phoneE164}`);
      return {
        ok: true,
        detail: `Calling ${phoneE164} now — the agent answers as soon as it is picked up.`,
        workflowRunId: run.workflow_run_id ?? null,
      };
    } catch (e) {
      return {
        ok: false,
        detail: e instanceof Error ? e.message : 'Dograh refused the call',
        workflowRunId: null,
      };
    }
  }

  /**
   * Ring a visitor who left their number.
   *
   * Never throws into the lead path: a callback request that Dograh could not
   * place must still be captured, because the lead is the thing of value and a
   * person can call them back. The failure is logged, not surfaced as a form
   * error the visitor can do nothing about.
   */
  async ringVisitor(orgId: string, phoneE164: string): Promise<boolean> {
    try {
      const { client, pub } = await this.clientFor(orgId);
      if (!pub.workflowId || !dograhOffersCallback(pub.callMode)) return false;
      await client.initiateCall(pub.workflowId, phoneE164);
      this.log.log(`dograh: callback queued org=${orgId} workflow=${pub.workflowId}`);
      return true;
    } catch (e) {
      this.log.warn(
        `dograh: callback NOT placed for org=${orgId} — ${e instanceof Error ? e.message : e}`,
      );
      return false;
    }
  }
}
