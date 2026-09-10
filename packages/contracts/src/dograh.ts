import { z } from 'zod';

/**
 * Dograh — a self-hosted voice-agent platform (FastAPI + Pipecat) — as the
 * voice on a centre's public landing page.
 *
 * Why this is not a TELEPHONY_DRIVER: that port is chosen once per deployment
 * and governs inbound DIDs, the dialler and the warm handoff to a human. This
 * is narrower on purpose. A centre points its landing page at one Dograh
 * workflow, and everything the dashboard does keeps running on whichever
 * telephony driver the deployment already selected. Connecting a landing page
 * must not be able to break live call handling.
 *
 * Two call paths, because Dograh exposes two and they solve different problems:
 *
 *   widget   — the visitor talks to the agent in the page over WebRTC, via
 *              Dograh's public `/api/v1/public/embed/*` endpoints. No phone
 *              number, no carrier, no per-minute cost. Instant.
 *   callback — the visitor leaves a number and Dograh rings it through
 *              `/api/v1/telephony/initiate-call`. Needs a telephony config and
 *              a DID on the Dograh side, which is their setup, not ours.
 */

/** The public embed API is versioned under this prefix on every Dograh host. */
export const DOGRAH_API_PREFIX = '/api/v1';

/**
 * What the in-page call button says.
 *
 * Not Dograh's default "Start Voice Call": on a client's own landing page the
 * agent is theirs, and a button naming the product they are being sold reads as
 * a demo of somebody else's software. Defined once so the two mint paths — a
 * hand-picked workflow and a website-generated one — cannot drift apart.
 */
/**
 * The agent's name, everywhere, always.
 *
 * Dograh's generator hardcodes "Sam" into every prompt it writes. A client's
 * agent introducing itself as Sam while the button beside it says Stella is
 * the kind of detail that makes a demo look assembled rather than built, so
 * this is the single source and every prompt path forces it.
 */
export const DOGRAH_AGENT_NAME = 'Stella';

export const DOGRAH_WIDGET_BUTTON_TEXT = 'Talk to Stella';
export const DOGRAH_CHAT_BUTTON_TEXT = 'Chat with Stella';

/**
 * The div the inline chat panel renders into.
 *
 * Chat is `embedMode: 'inline'` rather than a second floating bubble, because
 * the widget bundle only understands one position — `bottom-right` — so two
 * floating widgets land on top of each other. Inline also reads better: a chat
 * panel in a section of the page is a thing a visitor can see without clicking,
 * which is the point of showing it at all.
 */
export const DOGRAH_CHAT_CONTAINER_ID = 'dograh-chat-inline';

export const DograhCallMode = z.enum(['widget', 'callback', 'both']);
export type DograhCallMode = z.infer<typeof DograhCallMode>;

export const DOGRAH_CALL_MODE_LABELS: Record<DograhCallMode, { label: string; note: string }> = {
  widget: {
    label: 'Talk in the page',
    note: 'A button opens a live voice call with the agent. No phone number involved.',
  },
  callback: {
    label: 'Ring the visitor',
    note: 'The callback form asks Dograh to dial the number the visitor left.',
  },
  both: {
    label: 'Both',
    note: 'Talk now, or leave a number and be called. Needs Dograh telephony for the second.',
  },
};

/**
 * Non-secret Dograh config, stored in `Setting.dograhPublic`.
 *
 * Shapeless for the same reason `crmPublic` is: the embed token is minted by
 * Dograh and its shape is theirs, not ours, so a field they add later must not
 * need a migration here.
 */
export const DograhPublic = z.object({
  workflowId: z.number().int().positive().nullable().default(null),
  workflowName: z.string().default(''),
  /**
   * Minted by Dograh and rendered into public HTML — so it is not a secret and
   * is deliberately not in the encrypted blob. What keeps it from being useful
   * to anyone who copies it out of the page is `allowedDomains` below, enforced
   * by Dograh rather than by us.
   */
  /**
   * Dograh's uuid for the same workflow.
   *
   * Stored alongside the numeric id because the two are not interchangeable in
   * their API: the management endpoints key on the id, and the public call
   * endpoints key on the uuid. The create response returns only the id, so this
   * is looked up once at provisioning rather than on every demo call.
   */
  workflowUuid: z.string().default(''),
  embedToken: z.string().default(''),
  /**
   * A second token, for the same workflow, whose settings say
   * `widgetType: 'chat'`.
   *
   * Two tokens rather than one, because the widget reads its mode from the
   * token's settings (`settings.widgetType`) and resolves it once at load — so
   * a single token cannot offer both. Same agent, same prompts, same knowledge
   * either way; only the transport differs, which is exactly what makes showing
   * both worth doing.
   */
  chatEmbedToken: z.string().default(''),
  /**
   * The workflow the chat token belongs to — a duplicate of the voice one.
   *
   * Dograh's embed-token endpoint is create-*or-update*: one token per
   * workflow, so calling it twice with different settings silently overwrites
   * the first rather than producing a second token. Found by minting a voice
   * token, minting a chat token, and reading both back as chat.
   *
   * So chat needs its own workflow. It is a duplicate of the voice one — same
   * nodes, same prompts, same knowledge — created once and its id stored here,
   * because duplicating on every re-issue would leave a workflow behind on the
   * client's Dograh for every click of the button.
   */
  chatWorkflowId: z.number().int().positive().nullable().default(null),
  /** Whether the landing page renders the inline chat panel at all. */
  chatEnabled: z.boolean().default(true),
  /**
   * The `<script>` snippet Dograh returns alongside the token.
   *
   * Stored verbatim rather than reconstructed, because how to embed a Dograh
   * agent is Dograh's business and it has already told us. Guessing a widget
   * URL would be a guess that breaks on their next release. It is parsed and
   * origin-checked before anything is rendered — see dograhScriptFrom.
   */
  embedScript: z.string().default(''),
  allowedDomains: z.array(z.string()).default([]),
  callMode: DograhCallMode.default('both'),
});
export type DograhPublic = z.infer<typeof DograhPublic>;

/**
 * What the website editor is shown.
 *
 * `hasApiKey` rather than the key: the editor needs to know whether a
 * credential is stored so it can offer "replace" instead of "add", and that is
 * the whole of what it needs. Same reasoning as CrmConfigView.
 */
export const DograhConnectionView = z.object({
  connected: z.boolean(),
  baseUrl: z.string().nullable(),
  hasApiKey: z.boolean(),
  /** True when the key comes from DOGRAH_API_KEY rather than this centre's row. */
  inheritedFromDeployment: z.boolean(),
  workflowId: z.number().int().nullable(),
  workflowName: z.string().nullable(),
  hasEmbedToken: z.boolean(),
  /** Whether a demo call can be placed — the public call route needs the uuid. */
  canDemoCall: z.boolean(),
  hasChatToken: z.boolean(),
  chatEnabled: z.boolean(),
  allowedDomains: z.array(z.string()),
  callMode: DograhCallMode,
  /**
   * Set when this centre's Dograh emits a widget host that is not its own
   * public address — see dograhSnippetHostMismatch. Their side to fix; the page
   * works regardless.
   */
  snippetHostWarning: z.string().nullable(),
  updatedAt: z.coerce.date().nullable(),
});
export type DograhConnectionView = z.infer<typeof DograhConnectionView>;

export const SaveDograhConnectionInput = z.object({
  baseUrl: z.string().url('That does not look like a URL — e.g. https://voice.hirestella.ai'),
  /**
   * Omitted on a re-save that keeps the stored key, which is how the editor
   * lets someone change the workflow without re-typing a credential.
   */
  apiKey: z.string().trim().min(8, 'That key looks too short').max(500).optional(),
  workflowId: z.number().int().positive().nullable().optional(),
  callMode: DograhCallMode.optional(),
  /** Show the inline chat panel on the landing page alongside the call button. */
  chatEnabled: z.boolean().optional(),
});
export type SaveDograhConnectionInput = z.infer<typeof SaveDograhConnectionInput>;

export const TestDograhConnectionOutput = z.object({
  ok: z.boolean(),
  detail: z.string(),
  baseUrl: z.string(),
  /** Null when the call failed before it could count anything. */
  workflowCount: z.number().int().nullable(),
});
export type TestDograhConnectionOutput = z.infer<typeof TestDograhConnectionOutput>;

export const DograhWorkflowRow = z.object({
  id: z.number().int(),
  name: z.string(),
  /** Dograh's own lifecycle string. An archived workflow still answers, so this
   *  is shown rather than filtered — picking one is the admin's call. */
  status: z.string(),
  totalRuns: z.number().int().nonnegative(),
});
export type DograhWorkflowRow = z.infer<typeof DograhWorkflowRow>;

/** Result of minting (or re-minting) the page's embed token. */
export const ConnectDograhSiteOutput = z.object({
  ok: z.boolean(),
  detail: z.string(),
  hasEmbedToken: z.boolean(),
  allowedDomains: z.array(z.string()),
});
export type ConnectDograhSiteOutput = z.infer<typeof ConnectDograhSiteOutput>;

/**
 * What a public landing page is told, and nothing more.
 *
 * The API key never reaches this object. The embed token does, because the
 * visitor's browser is what calls Dograh's public endpoints with it.
 */
export const DograhWidgetDto = z.object({
  enabled: z.boolean(),
  baseUrl: z.string().nullable(),
  embedToken: z.string().nullable(),
  /**
   * The widget script to load, built from the configured host so it is
   * same-origin by construction. Null when there is nothing to load.
   */
  scriptSrc: z.string().nullable(),
  /** The inline chat widget's script, or null when chat is off/unprovisioned. */
  chatScriptSrc: z.string().nullable(),
  /** The id the page must give the div chat renders into. */
  chatContainerId: z.string(),
  /** Whether the callback form should ask Dograh to dial, rather than only capture. */
  callbackViaDograh: z.boolean(),
});
export type DograhWidgetDto = z.infer<typeof DograhWidgetDto>;

export const DOGRAH_WIDGET_DISABLED: DograhWidgetDto = {
  enabled: false,
  baseUrl: null,
  embedToken: null,
  scriptSrc: null,
  chatScriptSrc: null,
  chatContainerId: DOGRAH_CHAT_CONTAINER_ID,
  callbackViaDograh: false,
};

/**
 * The widget bundle's path on every Dograh host.
 *
 * Verified against a live instance rather than assumed: the bundle identifies
 * itself as "Dograh Widget v1.1.0 — Embeddable voice & chat widget", and reads
 * its whole configuration out of its own script URL's query string —
 * `token`, `apiEndpoint`, `environment` — falling back to api.dograh.com when
 * apiEndpoint is absent. That fallback is why apiEndpoint is always passed: a
 * self-hosted deployment must never have its widget talk to Dograh's cloud.
 */
const DOGRAH_WIDGET_PATH = '/embed/dograh-widget.js';

/**
 * Build the script URL for a centre's widget.
 *
 * Constructed rather than lifted out of Dograh's own `embed_script`, for two
 * reasons found the hard way:
 *
 *  1. That snippet is an IIFE that assigns `js.src` at runtime, so there is no
 *     `src` attribute to read without executing it.
 *  2. On a self-hosted Dograh it emits whatever its own widget-host setting
 *     says, and an instance that was never told its public address emits
 *     `http://localhost:3010` — a URL that resolves to the *visitor's* machine.
 *     Honouring it would put a dead script tag on a client's page.
 *
 * Building it from the host the admin configured is same-origin by
 * construction, so there is no third-party URL to validate and nothing a
 * misconfigured Dograh can do to a client's page.
 */
export function dograhWidgetSrc(baseUrl: string, token: string): string | null {
  if (!baseUrl || !token) return null;
  let host: URL;
  try {
    host = new URL(baseUrl);
  } catch {
    return null;
  }
  const api = host.origin;
  const url = new URL(DOGRAH_WIDGET_PATH, api);
  url.searchParams.set('token', token);
  url.searchParams.set('environment', 'production');
  url.searchParams.set('apiEndpoint', api);
  return url.toString();
}

/**
 * The host Dograh's own snippet points at, when it is not the configured one.
 *
 * Not used to decide what to load — see dograhWidgetSrc — but worth telling an
 * admin about, because it means their Dograh does not know its own public
 * address. Their snippet is broken for every other integration they paste it
 * into, and only this one works around it. Returns null when the snippet agrees
 * with the configured host, or when there is nothing to compare.
 */
export function dograhSnippetHostMismatch(snippet: string, baseUrl: string): string | null {
  if (!snippet || !baseUrl) return null;
  // Either a plain src attribute or the `js.src = '…'` of their IIFE loader.
  const found =
    /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i.exec(snippet)?.[1] ??
    /\.src\s*=\s*["']([^"']+)["']/i.exec(snippet)?.[1];
  if (!found) return null;
  try {
    const src = new URL(found, baseUrl);
    const host = new URL(baseUrl);
    return src.origin === host.origin ? null : src.origin;
  } catch {
    return null;
  }
}

/** `widget`/`both` show the in-page button; `callback`/`both` route the form. */
export function dograhOffersWidget(mode: DograhCallMode): boolean {
  return mode === 'widget' || mode === 'both';
}
export function dograhOffersCallback(mode: DograhCallMode): boolean {
  return mode === 'callback' || mode === 'both';
}
