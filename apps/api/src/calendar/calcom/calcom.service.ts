import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { randomBytes } from 'node:crypto';
import {
  type ApiEnv,
  type BookingRow,
  type BookingSource,
  BOOKING_SOURCES,
  CalendarConfig,
  type CalcomConnectInput,
  type CalcomLookupInput,
  type CalcomLookupOutput,
  CalcomPublic,
  type CalcomStatus,
} from '@superdemo/contracts';
import { Prisma } from '@superdemo/db';
import { ENV } from '../../config/config.module';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../tenancy/tenant-context.service';
import { decryptSecret, encryptSecret, fingerprint } from '../../shared/secret-box';
import { toBookingRow } from '../mock-calendar.provider';
import { CalcomClient, CalcomError, type CalcomBooking } from './calcom.client';

/** How often every connected centre is reconciled with Cal.com. */
const SYNC_INTERVAL_MS = 60_000;
/** The window reconciled each time: recent past (late cancellations) to two months out. */
const SYNC_BACK_MS = 7 * 86_400_000;
const SYNC_AHEAD_MS = 62 * 86_400_000;

export interface CalcomConnection {
  client: CalcomClient;
  pub: CalcomPublic;
}

/**
 * A centre's Cal.com connection: connecting and disconnecting it, and keeping
 * our copy of its bookings in step with Cal.com.
 *
 * The key is stored the way CRM credentials are — one AES-GCM blob under
 * CRM_SECRET_KEY — and never returned. Bookings made on the centre's own
 * cal.com link reach us two ways: a webhook when the API has a public URL to
 * give Cal.com (PUBLIC_BASE_URL), and a reconcile every minute regardless,
 * which also catches anything a webhook missed. The webhook carries no data we
 * trust — it only triggers that same reconcile — so its URL token is its whole
 * authentication.
 */
@Injectable()
export class CalcomService {
  private readonly log = new Logger(CalcomService.name);
  private syncing = false;
  private readonly orgSyncs = new Map<string, Promise<number>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantContext,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  /* ============================== connection ============================== */

  async status(orgId: string): Promise<CalcomStatus> {
    const conn = await this.publicFor(orgId);
    if (!conn) {
      return {
        connected: false,
        account: null,
        eventType: null,
        bookingUrl: null,
        keyHint: null,
        webhook: false,
        lastSyncedAt: null,
        lastError: null,
      };
    }
    return {
      connected: true,
      account: conn.account,
      eventType: conn.eventType,
      bookingUrl: bookingUrl(conn),
      keyHint: conn.keyHint,
      webhook: conn.webhookId != null,
      lastSyncedAt: conn.lastSyncedAt,
      lastError: conn.lastError,
    };
  }

  /** The account and event types behind a key — the step before connecting. */
  async lookup(orgId: string, input: CalcomLookupInput): Promise<CalcomLookupOutput> {
    const client = input.apiKey ? new CalcomClient(input.apiKey) : (await this.connection(orgId))?.client;
    if (!client) throw new BadRequestException('Paste your Cal.com API key');
    const [account, eventTypes] = await Promise.all([
      client.me().catch(rethrowKey),
      client.eventTypes().catch(rethrowKey),
    ]);
    return { account, eventTypes };
  }

  async connect(orgId: string, input: CalcomConnectInput): Promise<CalcomStatus> {
    const secret = this.env.CRM_SECRET_KEY;
    if (!secret) throw new BadRequestException('CRM_SECRET_KEY is not configured on the server');

    const previous = await this.connection(orgId);
    const key = input.apiKey ?? (await this.keyFor(orgId));
    if (!key) throw new BadRequestException('Paste your Cal.com API key');

    const client = new CalcomClient(key);
    const { account, eventTypes } = await this.lookup(orgId, { apiKey: key });
    const eventType = eventTypes.find((e) => e.id === input.eventTypeId);
    if (!eventType) throw new BadRequestException('That event type is not on this Cal.com account');

    // A new key may belong to another account, which cannot delete the old
    // account's webhook — so drop it with the client that made it.
    if (previous?.pub.webhookId != null) {
      await previous.client.deleteWebhook(previous.pub.webhookId).catch(() => undefined);
    }
    const webhookId = await this.registerWebhook(orgId, client);

    const pub: CalcomPublic = {
      account,
      eventType,
      keyHint: `…${key.slice(-4)} (${fingerprint(key)})`,
      webhookId,
      lastSyncedAt: null,
      lastError: null,
    };
    await this.tenants.runAs(orgId, null, async () => {
      const setting = await this.prisma.setting.findFirst({
        where: { orgId },
        select: { calendarConfig: true },
      });
      const config = CalendarConfig.parse({
        ...(CalendarConfig.safeParse(setting?.calendarConfig ?? {}).data ?? {}),
        provider: 'calcom',
      });
      await this.prisma.setting.upsert({
        where: { orgId },
        create: {
          orgId,
          calendarConfig: config,
          calcomPublic: pub,
          calcomSecretsEnc: encryptSecret(key, secret),
        },
        update: {
          calendarConfig: config,
          calcomPublic: pub,
          calcomSecretsEnc: encryptSecret(key, secret),
        },
      });
    });
    this.log.log(
      `org ${orgId} connected Cal.com ${account.username ?? account.email}, event type ${eventType.id} (${eventType.slug})` +
        (webhookId != null ? `, webhook ${webhookId}` : ', polling only'),
    );

    await this.syncOrg(orgId).catch(() => undefined);
    return this.status(orgId);
  }

  /** Back to the built-in calendar. Bookings already pulled in are kept. */
  async disconnect(orgId: string): Promise<CalcomStatus> {
    const conn = await this.connection(orgId);
    if (conn?.pub.webhookId != null) {
      await conn.client.deleteWebhook(conn.pub.webhookId).catch(() => undefined);
    }
    await this.tenants.runAs(orgId, null, async () => {
      const setting = await this.prisma.setting.findFirst({
        where: { orgId },
        select: { calendarConfig: true },
      });
      const config = CalendarConfig.parse({
        ...(CalendarConfig.safeParse(setting?.calendarConfig ?? {}).data ?? {}),
        provider: 'mock',
      });
      await this.prisma.setting.updateMany({
        where: { orgId },
        data: { calendarConfig: config, calcomPublic: Prisma.DbNull, calcomSecretsEnc: null },
      });
    });
    this.log.log(`org ${orgId} disconnected Cal.com`);
    return this.status(orgId);
  }

  /** The client and connection details, or null when Cal.com is not connected. */
  async connection(orgId: string): Promise<CalcomConnection | null> {
    const pub = await this.publicFor(orgId);
    if (!pub) return null;
    const key = await this.keyFor(orgId);
    return key ? { client: new CalcomClient(key), pub } : null;
  }

  /* ================================= sync ================================= */

  @Interval(SYNC_INTERVAL_MS)
  async tick(): Promise<void> {
    if (this.syncing) return;
    this.syncing = true;
    try {
      // No tenant context here, so this reads every centre's row on purpose.
      const settings = await this.prisma.setting.findMany({
        where: { calcomSecretsEnc: { not: null } },
        select: { orgId: true },
      });
      for (const { orgId } of settings) {
        await this.syncOrg(orgId).catch(() => undefined);
      }
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Reconcile one centre with Cal.com. Concurrent calls for the same centre —
   * the minute tick, a webhook and a "Sync now" — share one run.
   */
  syncOrg(orgId: string): Promise<number> {
    const running = this.orgSyncs.get(orgId);
    if (running) return running;
    const run = this.tenants
      .runAs(orgId, null, () => this.reconcile(orgId))
      .finally(() => this.orgSyncs.delete(orgId));
    this.orgSyncs.set(orgId, run);
    return run;
  }

  /** The webhook's entry point: find the centre by its calendar token and reconcile. */
  async onWebhook(token: string): Promise<void> {
    if (!/^cal_[A-Za-z0-9_-]{16,64}$/.test(token)) throw new NotFoundException();
    const setting = await this.prisma.setting.findUnique({
      where: { calendarToken: token },
      select: { orgId: true, calcomSecretsEnc: true },
    });
    if (!setting?.calcomSecretsEnc) throw new NotFoundException();
    void this.syncOrg(setting.orgId).catch(() => undefined);
  }

  /**
   * Store a booking Cal.com has just confirmed. Shared by the provider (a
   * booking we made) and the reconcile (one made on cal.com), and safe for
   * both to call with the same booking: whichever lands second updates.
   */
  async upsertLocal(
    orgId: string,
    b: CalcomBooking,
    extra: { source?: BookingSource; contactId?: string | null; phoneE164?: string; notes?: string | null } = {},
  ): Promise<BookingRow> {
    const status = /cancel|reject/.test(b.status) ? 'CANCELLED' : 'BOOKED';
    const data = {
      name: b.attendee?.name ?? b.title ?? 'Cal.com booking',
      email: realEmail(b.attendee?.email),
      startsAt: new Date(b.start),
      endsAt: new Date(b.end),
      status,
    };
    const existing = await this.prisma.calendarBooking.findFirst({
      where: { orgId, externalUid: b.uid },
    });
    if (existing) {
      const changed =
        existing.status !== data.status ||
        existing.startsAt.getTime() !== data.startsAt.getTime() ||
        existing.endsAt.getTime() !== data.endsAt.getTime();
      if (!changed) return toBookingRow(existing);
      return toBookingRow(
        await this.prisma.calendarBooking.update({
          where: { id: existing.id },
          data: { status: data.status, startsAt: data.startsAt, endsAt: data.endsAt },
        }),
      );
    }

    const source = extra.source ?? sourceOf(b.metadata.source);
    const phoneE164 = extra.phoneE164 ?? b.attendee?.phone ?? '';
    const contactId = extra.contactId !== undefined ? extra.contactId : await this.contactFor(orgId, phoneE164, data);
    try {
      return toBookingRow(
        await this.prisma.calendarBooking.create({
          data: {
            orgId,
            externalUid: b.uid,
            contactId,
            phoneE164,
            notes: extra.notes !== undefined ? extra.notes : b.notes,
            source,
            ...data,
          },
        }),
      );
    } catch (err) {
      // The other writer got there between our read and our insert.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const row = await this.prisma.calendarBooking.findFirst({ where: { orgId, externalUid: b.uid } });
        if (row) return toBookingRow(row);
      }
      throw err;
    }
  }

  /* ================================ private =============================== */

  private async reconcile(orgId: string): Promise<number> {
    const conn = await this.connection(orgId);
    if (!conn) return 0;
    const now = Date.now();
    try {
      const remote = await conn.client.bookings(
        conn.pub.eventType.id,
        new Date(now - SYNC_BACK_MS),
        new Date(now + SYNC_AHEAD_MS),
      );
      let changed = 0;
      for (const b of remote) {
        if (!b.start || !b.end) continue;
        const before = await this.prisma.calendarBooking.findFirst({
          where: { orgId, externalUid: b.uid },
          select: { status: true, startsAt: true },
        });
        const after = await this.upsertLocal(orgId, b);
        if (!before || before.status !== after.status || before.startsAt.getTime() !== after.startsAt.getTime()) {
          changed++;
        }
      }
      await this.patchPublic(orgId, { lastSyncedAt: new Date().toISOString(), lastError: null });
      if (changed) this.log.log(`org ${orgId}: ${changed} Cal.com booking(s) added or changed`);
      return changed;
    } catch (err) {
      const message = (err as Error).message;
      this.log.warn(`Cal.com sync for org ${orgId} failed: ${message}`);
      await this.patchPublic(orgId, { lastError: message }).catch(() => undefined);
      throw err;
    }
  }

  /** Register a webhook if Cal.com can reach us; null means poll only. */
  private async registerWebhook(orgId: string, client: CalcomClient): Promise<number | null> {
    const base = this.env.PUBLIC_BASE_URL?.replace(/\/+$/, '');
    if (!base || /localhost|127\.0\.0\.1/.test(base)) return null;
    const token = await this.calendarToken(orgId);
    try {
      return await client.createWebhook(
        `${base}/api/public/calcom/${token}`,
        randomBytes(24).toString('base64url'),
      );
    } catch (err) {
      this.log.warn(`could not register a Cal.com webhook for org ${orgId}: ${(err as Error).message}`);
      return null;
    }
  }

  /** The centre's calendar token, minted if missing — the same one the voice tools use. */
  private async calendarToken(orgId: string): Promise<string> {
    return this.tenants.runAs(orgId, null, async () => {
      const setting = await this.prisma.setting.findFirst({
        where: { orgId },
        select: { calendarToken: true },
      });
      if (setting?.calendarToken) return setting.calendarToken;
      const token = `cal_${randomBytes(24).toString('base64url')}`;
      await this.prisma.setting.upsert({
        where: { orgId },
        create: { orgId, calendarToken: token },
        update: { calendarToken: token },
      });
      return token;
    });
  }

  private async publicFor(orgId: string): Promise<CalcomPublic | null> {
    const setting = await this.tenants.runAs(orgId, null, () =>
      this.prisma.setting.findFirst({
        where: { orgId },
        select: { calcomPublic: true, calcomSecretsEnc: true },
      }),
    );
    if (!setting?.calcomSecretsEnc || !setting.calcomPublic) return null;
    const parsed = CalcomPublic.safeParse(setting.calcomPublic);
    return parsed.success ? parsed.data : null;
  }

  private async keyFor(orgId: string): Promise<string | null> {
    const setting = await this.tenants.runAs(orgId, null, () =>
      this.prisma.setting.findFirst({ where: { orgId }, select: { calcomSecretsEnc: true } }),
    );
    if (!setting?.calcomSecretsEnc) return null;
    try {
      return decryptSecret(setting.calcomSecretsEnc, this.env.CRM_SECRET_KEY ?? '');
    } catch (err) {
      this.log.error(`stored Cal.com key for org ${orgId} cannot be decrypted: ${(err as Error).message}`);
      return null;
    }
  }

  private async patchPublic(orgId: string, patch: Partial<CalcomPublic>): Promise<void> {
    const pub = await this.publicFor(orgId);
    if (!pub) return;
    await this.tenants.runAs(orgId, null, () =>
      this.prisma.setting.updateMany({ where: { orgId }, data: { calcomPublic: { ...pub, ...patch } } }),
    );
  }

  /** Match a Cal.com guest to a contact by phone, as every other booking path does. */
  private async contactFor(
    orgId: string,
    phoneE164: string,
    data: { name: string; email: string | null },
  ): Promise<string | null> {
    if (!/^\+\d{7,15}$/.test(phoneE164)) return null;
    const existing = await this.prisma.contact.findFirst({ where: { orgId, phoneE164 } });
    if (existing) return existing.id;
    const created = await this.prisma.contact.create({
      data: { orgId, phoneE164, name: data.name, email: data.email },
    });
    return created.id;
  }
}

/* ================================ helpers ================================= */

/**
 * For an event type that insists on an attendee email, when a caller booked
 * by the voice agent did not give one. This address stands in — on the reserved
 * example.com domain, so no invite is ever delivered to a stranger — and is
 * never shown back as the guest's email.
 */
export const PLACEHOLDER_EMAIL_DOMAIN = 'guest.example.com';

export function placeholderEmail(phoneE164: string): string {
  return `${phoneE164.replace(/\D/g, '') || 'guest'}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

/**
 * The guest's email, or null when it is a stand-in: ours, or the one Cal.com
 * invents for a phone-only booking (<digits>@sms.cal.com).
 */
function realEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return email.endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`) || email.endsWith('@sms.cal.com') ? null : email;
}

function sourceOf(value: string | undefined): BookingSource {
  return value && (BOOKING_SOURCES as readonly string[]).includes(value)
    ? (value as BookingSource)
    : 'calcom';
}

function bookingUrl(pub: CalcomPublic): string | null {
  return pub.account.username && pub.eventType.slug
    ? `https://cal.com/${pub.account.username}/${pub.eventType.slug}`
    : null;
}

/** A rejected key reads as a key problem, not a 500. */
function rethrowKey(err: unknown): never {
  if (err instanceof CalcomError && (err.status === 401 || err.status === 403)) {
    throw new BadRequestException('Cal.com did not accept that API key. Check it under Settings → Developer → API keys.');
  }
  if (err instanceof CalcomError) throw new BadRequestException(`Cal.com: ${err.message}`);
  throw err;
}
