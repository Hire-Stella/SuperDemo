import { Injectable, Logger, NotFoundException, type OnModuleInit } from '@nestjs/common';
import { chunk, cosine, embed, expand, keywordsOf, tokenize } from '@fit-ai/db';
import type {
  KnowledgeDocDto,
  KnowledgeRetriever,
  KnowledgeSearchResult,
  Skill,
  UpsertKnowledgeDocInput,
} from '@fit-ai/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenancy/tenant-context.service';

interface IndexedChunk {
  chunkId: string;
  docId: string;
  docTitle: string;
  category: Skill;
  content: string;
  embedding: number[];
  /** Expanded token set of title (repeated for weight) + content. */
  terms: Set<string>;
  /** Token counts for BM25. */
  tf: Map<string, number>;
  length: number;
}

/**
 * One tenant's corpus, with its own IDF.
 *
 * Per-org rather than one shared index, for two reasons. The obvious one is
 * isolation: this index lives in memory, so the Prisma extension cannot help
 * here — a shared index would let a clinic's AI answer callers out of a
 * language school's course catalogue. The subtler one is that IDF is corpus
 * relative. Pooling every tenant's documents makes a term that is distinctive
 * inside one centre look common, which moves the confidence score, which moves
 * the escalation decision. Each centre gets its own statistics.
 */
interface OrgIndex {
  chunks: IndexedChunk[];
  idf: Map<string, number>;
  avgLength: number;
}

/**
 * Retrieval over the FIT course knowledge base.
 *
 * The index is held in memory: the corpus is a few hundred chunks, so a full
 * scan is faster than any round trip, and it lets us compute IDF properly —
 * which turned out to matter. An early version scored on raw cosine alone and
 * every query landed between 0.20 and 0.45, meaning a fixed confidence floor
 * either escalated everything or nothing.
 *
 * Confidence is therefore *IDF-weighted query coverage*: of all the informative
 * meaning in the caller's question, how much does the best passage actually
 * account for? That is naturally 0..1, is explainable to a client ("it didn't
 * know, so it handed off"), and behaves sensibly for questions about courses
 * FIT doesn't teach — those score near zero because the distinctive words
 * ("pilot", "licence") appear nowhere in the corpus.
 */
@Injectable()
export class KnowledgeService implements KnowledgeRetriever, OnModuleInit {
  private readonly log = new Logger(KnowledgeService.name);

  private indexes = new Map<string, OrgIndex>();
  private ready = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantContext,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rebuild();
  }

  /**
   * Rebuild the in-memory indexes. Called at boot and after any KB edit.
   *
   * Boot has no tenant context, so it must read every centre's chunks and group
   * them; an edit does have one, and rebuilds only that centre.
   */
  async rebuild(): Promise<void> {
    const scopeOrgId = this.tenants.orgId();

    const chunks = await this.prisma.knowledgeChunk.findMany({
      include: { doc: { select: { id: true, title: true, category: true } } },
      orderBy: [{ docId: 'asc' }, { ordinal: 'asc' }],
    });

    const indexed: (IndexedChunk & { orgId: string })[] = chunks.map((c) => {
      // Title tokens are weighted x3: a caller says "the ABA course", and the
      // discriminating word lives in the title, not necessarily the body.
      const titleTokens = expand(tokenize(c.doc.title));
      const bodyTokens = expand(tokenize(c.content));
      const all = [...titleTokens, ...titleTokens, ...titleTokens, ...bodyTokens];

      const tf = new Map<string, number>();
      for (const t of all) tf.set(t, (tf.get(t) ?? 0) + 1);

      return {
        orgId: c.orgId,
        chunkId: c.id,
        docId: c.docId,
        docTitle: c.doc.title,
        category: c.doc.category as Skill,
        content: c.content,
        embedding: c.embedding,
        terms: new Set(all),
        tf,
        length: all.length,
      };
    });

    const byOrg = new Map<string, IndexedChunk[]>();
    for (const c of indexed) {
      const list = byOrg.get(c.orgId);
      if (list) list.push(c);
      else byOrg.set(c.orgId, [c]);
    }

    // A scoped rebuild replaces only its own entry, so one centre editing its
    // knowledge base cannot drop another centre's index.
    if (scopeOrgId) this.indexes.set(scopeOrgId, buildIndex(byOrg.get(scopeOrgId) ?? []));
    else {
      this.indexes = new Map([...byOrg].map(([orgId, list]) => [orgId, buildIndex(list)]));
    }
    this.ready = true;

    const total = scopeOrgId
      ? (this.indexes.get(scopeOrgId)?.chunks.length ?? 0)
      : indexed.length;
    this.log.log(
      scopeOrgId
        ? `index rebuilt for one centre: ${total} chunks`
        : `index rebuilt: ${total} chunks across ${this.indexes.size} centre(s)`,
    );
  }

  /** IDF for an unseen term — treat it as maximally informative and absent. */
  private idfOf(idx: OrgIndex, term: string): number {
    return idx.idf.get(term) ?? Math.log(1 + idx.chunks.length);
  }

  async search(params: {
    query: string;
    limit?: number;
    category?: Skill;
  }): Promise<KnowledgeSearchResult[]> {
    if (!this.ready) await this.rebuild();
    const limit = params.limit ?? 4;

    // Fail closed. A retrieval with no centre in context has no right answer,
    // and picking any corpus would mean answering one client's caller with
    // another's material. Returning nothing makes the AI escalate to a human,
    // which is the correct outcome for "I don't know whose question this is".
    const orgId = this.tenants.orgId();
    if (!orgId) {
      this.log.warn('knowledge search with no organisation in context — returning nothing');
      return [];
    }
    const idx = this.indexes.get(orgId);
    if (!idx || idx.chunks.length === 0) return [];

    const queryTerms = expand(tokenize(params.query));
    if (queryTerms.length === 0) return [];

    // Deduplicate; a repeated word shouldn't count twice toward coverage.
    const uniqueQueryTerms = [...new Set(queryTerms)];
    const queryVec = embed(params.query);

    const k1 = 1.4;
    const b = 0.7;

    const scored = idx.chunks
      .filter((c) => !params.category || c.category === params.category)
      .map((c) => {
        // BM25 for ranking.
        let bm25 = 0;
        for (const term of uniqueQueryTerms) {
          const f = c.tf.get(term);
          if (!f) continue;
          const norm = 1 - b + b * (c.length / idx.avgLength);
          bm25 += this.idfOf(idx, term) * ((f * (k1 + 1)) / (f + k1 * norm));
        }
        // Cosine as a secondary signal — helps on paraphrase where exact terms
        // miss but the overall bag of words is similar.
        const cos = cosine(queryVec, c.embedding);
        return { c, score: bm25 + cos * 2 };
      })
      .filter((s) => s.score > 0)
      .sort((a, b2) => b2.score - a.score)
      .slice(0, limit);

    if (scored.length === 0) return [];

    // Coverage confidence, computed against the top hit. Reported on every
    // result so the caller can see the spread, but the orchestrator only reads
    // results[0].score.
    const totalIdf = uniqueQueryTerms.reduce((s, t) => s + this.idfOf(idx, t), 0);

    return scored.map(({ c, score }) => {
      const covered = uniqueQueryTerms
        .filter((t) => c.terms.has(t))
        .reduce((s, t) => s + this.idfOf(idx, t), 0);
      const coverage = totalIdf > 0 ? covered / totalIdf : 0;
      return {
        chunkId: c.chunkId,
        docId: c.docId,
        docTitle: c.docTitle,
        category: c.category,
        content: c.content,
        // `score` IS the confidence the escalation rules compare against.
        score: Number(coverage.toFixed(4)),
        rank: score,
      } as KnowledgeSearchResult & { rank: number };
    });
  }

  /* ------------------------------- CRUD ---------------------------------- */

  async list(): Promise<KnowledgeDocDto[]> {
    const docs = await this.prisma.knowledgeDoc.findMany({
      include: { _count: { select: { chunks: true } } },
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });
    return docs.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category as Skill,
      source: d.source,
      chunkCount: d._count.chunks,
      updatedAt: d.updatedAt,
    }));
  }

  async get(id: string) {
    const doc = await this.prisma.knowledgeDoc.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async create(input: UpsertKnowledgeDocInput): Promise<KnowledgeDocDto> {
    const doc = await this.prisma.knowledgeDoc.create({
      data: {
        title: input.title,
        category: input.category,
        source: input.source,
        content: input.content,
      },
    });
    await this.reindexDoc(doc.id, doc.title, doc.content);
    await this.rebuild();
    return {
      id: doc.id,
      title: doc.title,
      category: doc.category as Skill,
      source: doc.source,
      chunkCount: chunk(doc.content).length,
      updatedAt: doc.updatedAt,
    };
  }

  async update(id: string, input: UpsertKnowledgeDocInput): Promise<KnowledgeDocDto> {
    await this.get(id);
    const doc = await this.prisma.knowledgeDoc.update({
      where: { id },
      data: {
        title: input.title,
        category: input.category,
        source: input.source,
        content: input.content,
      },
    });
    await this.reindexDoc(doc.id, doc.title, doc.content);
    await this.rebuild();
    return {
      id: doc.id,
      title: doc.title,
      category: doc.category as Skill,
      source: doc.source,
      chunkCount: chunk(doc.content).length,
      updatedAt: doc.updatedAt,
    };
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.prisma.knowledgeDoc.delete({ where: { id } });
    await this.rebuild();
  }

  private async reindexDoc(docId: string, title: string, content: string): Promise<void> {
    await this.prisma.knowledgeChunk.deleteMany({ where: { docId } });
    const pieces = chunk(content);
    await this.prisma.knowledgeChunk.createMany({
      data: pieces.map((piece, ordinal) => {
        const embedText = `${title}\n${piece}`;
        return {
          docId,
          ordinal,
          content: piece,
          embedding: embed(embedText),
          keywords: keywordsOf(embedText),
        };
      }),
    });
  }
}

/** BM25 statistics for one centre's corpus. */
function buildIndex(chunks: IndexedChunk[]): OrgIndex {
  const df = new Map<string, number>();
  for (const c of chunks) for (const t of c.terms) df.set(t, (df.get(t) ?? 0) + 1);

  const N = Math.max(1, chunks.length);
  const idf = new Map<string, number>();
  for (const [term, freq] of df) {
    // Smoothed IDF, floored at a small positive value so a term present in
    // every document still contributes a little rather than exactly nothing.
    idf.set(term, Math.max(0.05, Math.log(1 + (N - freq + 0.5) / (freq + 0.5))));
  }

  return {
    chunks,
    idf,
    avgLength: chunks.length ? chunks.reduce((s, c) => s + c.length, 0) / chunks.length : 1,
  };
}
