import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AE_NUMBER_STOCK, OTHER_NUMBER_STOCK } from '@fit-ai/db/data';
import type {
  AvailableNumberDto,
  PhoneNumberDto,
  PurchaseNumberInput,
  SearchNumbersQuery,
  UpdateNumberInput,
} from '@fit-ai/contracts';
import { PrismaService } from '../prisma/prisma.service';

/**
 * DID inventory — the SIM-card-replacement story made tangible.
 *
 * Search a catalogue of +971 virtual numbers, buy one, point it at a queue and
 * an AI agent, and agents in Dubai, India and Egypt all answer it from the
 * browser: no SIM, no roaming.
 *
 * The catalogue is mocked. Real UAE provisioning requires a TDRA-licensed
 * carrier — UAE law reserves PSTN-terminating voice to licensed operators, so
 * this is a regulatory constraint, not an engineering gap. Numbers in the stock
 * list are fictional by construction and cannot receive real calls.
 */
@Injectable()
export class NumbersService {
  private readonly log = new Logger(NumbersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Catalogue search, excluding anything already owned. */
  async search(query: SearchNumbersQuery): Promise<AvailableNumberDto[]> {
    const country = query.country.toUpperCase();
    const stock =
      country === 'AE'
        ? AE_NUMBER_STOCK
        : (OTHER_NUMBER_STOCK[country] ?? []);

    const owned = new Set(
      (
        await this.prisma.phoneNumber.findMany({
          where: { status: { in: ['ASSIGNED', 'AVAILABLE'] } },
          select: { e164: true },
        })
      ).map((n) => n.e164),
    );

    return stock
      .filter((s) => !owned.has(s.e164))
      .filter((s) => (query.contains ? s.e164.includes(query.contains) : true))
      .slice(0, query.limit)
      .map((s) => ({
        e164: s.e164,
        country,
        region: s.region,
        monthlyCostUsd: s.monthlyCostUsd,
        setupCostUsd: s.setupCostUsd,
        capabilities: s.capabilities,
      }));
  }

  async list(): Promise<PhoneNumberDto[]> {
    const numbers = await this.prisma.phoneNumber.findMany({
      where: { status: { not: 'RELEASED' } },
      include: { inboundQueue: true, aiAgent: true },
      orderBy: [{ status: 'asc' }, { e164: 'asc' }],
    });

    const since = new Date(Date.now() - 30 * 864e5);
    const counts = await this.prisma.call.groupBy({
      by: ['toNumber'],
      where: { ringingAt: { gte: since } },
      _count: { _all: true },
    });
    const byNumber = new Map(counts.map((c) => [c.toNumber, c._count._all]));

    return numbers.map((n) => ({
      id: n.id,
      e164: n.e164,
      label: n.label,
      country: n.country,
      region: n.region,
      monthlyCostUsd: Number(n.monthlyCostUsd),
      status: n.status,
      provider: n.provider,
      inboundQueueId: n.inboundQueueId,
      inboundQueueName: n.inboundQueue?.name ?? null,
      aiAgentId: n.aiAgentId,
      aiAgentName: n.aiAgent?.name ?? null,
      recordingEnabled: n.recordingEnabled,
      purchasedAt: n.purchasedAt,
      calls30d: byNumber.get(n.e164) ?? 0,
    }));
  }

  async purchase(input: PurchaseNumberInput): Promise<PhoneNumberDto> {
    const existing = await this.prisma.phoneNumber.findUnique({ where: { e164: input.e164 } });
    if (existing && existing.status !== 'RELEASED') {
      throw new BadRequestException(`${input.e164} is already in your inventory`);
    }

    const stock = [...AE_NUMBER_STOCK, ...Object.values(OTHER_NUMBER_STOCK).flat()].find(
      (s) => s.e164 === input.e164,
    );
    if (!stock) {
      throw new BadRequestException(
        `${input.e164} is not in the available catalogue. Search for available numbers first.`,
      );
    }

    // Default the routing so a freshly bought number is immediately usable
    // rather than silently answering nothing.
    const queueId =
      input.inboundQueueId ??
      (await this.prisma.queue.findFirst({ where: { requiredSkill: 'GENERAL' }, select: { id: true } }))
        ?.id;
    const aiAgentId =
      input.aiAgentId ??
      (await this.prisma.aiAgent.findFirst({ where: { isActive: true }, select: { id: true } }))?.id;

    const data = {
      e164: input.e164,
      label: input.label ?? `${stock.region} line`,
      country: input.e164.startsWith('+971') ? 'AE' : 'XX',
      region: stock.region,
      provider: 'mock',
      monthlyCostUsd: String(stock.monthlyCostUsd),
      status: 'ASSIGNED' as const,
      inboundQueueId: queueId ?? null,
      aiAgentId: aiAgentId ?? null,
      purchasedAt: new Date(),
      releasedAt: null,
    };

    const number = existing
      ? await this.prisma.phoneNumber.update({ where: { id: existing.id }, data })
      : await this.prisma.phoneNumber.create({ data });

    this.log.log(`provisioned ${number.e164} (mock)`);
    return (await this.list()).find((n) => n.id === number.id)!;
  }

  async update(id: string, input: UpdateNumberInput): Promise<PhoneNumberDto> {
    const existing = await this.prisma.phoneNumber.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Number not found');

    await this.prisma.phoneNumber.update({
      where: { id },
      data: {
        label: input.label === undefined ? undefined : input.label,
        inboundQueueId: input.inboundQueueId === undefined ? undefined : input.inboundQueueId,
        aiAgentId: input.aiAgentId === undefined ? undefined : input.aiAgentId,
        recordingEnabled: input.recordingEnabled,
      },
    });

    return (await this.list()).find((n) => n.id === id)!;
  }

  async release(id: string): Promise<void> {
    const existing = await this.prisma.phoneNumber.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Number not found');

    // Their two published numbers are their real carrier's — releasing them here
    // would misrepresent what this platform controls.
    if (existing.provider === 'existing-carrier') {
      throw new BadRequestException(
        `${existing.e164} belongs to the institute's existing carrier and cannot be released from this platform.`,
      );
    }

    await this.prisma.phoneNumber.update({
      where: { id },
      data: { status: 'RELEASED', releasedAt: new Date(), inboundQueueId: null, aiAgentId: null },
    });
  }

  /**
   * Roaming saving, for the proposal.
   *
   * The client's stated pain: remote agents in India and Egypt on physical SIMs,
   * paying roaming. Browser softphones remove the SIM entirely — this quantifies
   * that, using their actual headcount.
   */
  async roamingSavingEstimate(): Promise<{
    remoteAgents: number;
    assumedMonthlyRoamingPerAgentUsd: number;
    currentMonthlyRoamingUsd: number;
    platformNumberCostUsd: number;
    estimatedMonthlySavingUsd: number;
    note: string;
  }> {
    const remoteAgents = await this.prisma.user.count({
      where: { isActive: true, location: { in: ['INDIA', 'EGYPT'] } },
    });

    const numbers = await this.prisma.phoneNumber.findMany({
      where: { status: 'ASSIGNED', provider: 'mock' },
      select: { monthlyCostUsd: true },
    });
    const platformNumberCostUsd = numbers.reduce((s, n) => s + Number(n.monthlyCostUsd), 0);

    // Deliberately a stated assumption, not a claim. Replace with the client's
    // real invoice figures before quoting.
    const assumed = 120;
    const current = remoteAgents * assumed;

    return {
      remoteAgents,
      assumedMonthlyRoamingPerAgentUsd: assumed,
      currentMonthlyRoamingUsd: current,
      platformNumberCostUsd,
      estimatedMonthlySavingUsd: Math.max(0, current - platformNumberCostUsd),
      note:
        'Roaming cost per agent is an assumption, not a measurement. Replace it with the ' +
        "institute's actual telecom invoices before presenting this figure.",
    };
  }
}
