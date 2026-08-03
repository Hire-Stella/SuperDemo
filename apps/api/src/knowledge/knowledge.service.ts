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

  private index: IndexedChunk[] = [];
  private idf = new Map<string, number>();
  private avgLength = 1;
  private ready = false;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.rebuild();
  }

  /** Rebuild the in-memory index. Called at boot and after any KB edit. */
  async rebuild(): Promise<void> {
    const chunks = await this.prisma.knowledgeChunk.findMany({
      include: { doc: { select: { id: true, title: true, category: true } } },
      orderBy: [{ docId: 'asc' }, { ordinal: 'asc' }],
    });

    const indexed: IndexedChunk[] = chunks.map((c) => {
      // Title tokens are weighted x3: a caller says "the ABA course", and the
      // discriminating word lives in the title, not necessarily the body.
      const titleTokens = expand(tokenize(c.doc.title));
      const bodyTokens = expand(tokenize(c.content));
      const all = [...titleTokens, ...titleTokens, ...titleTokens, ...bodyTokens];

      const tf = new Map<string, number>();
      for (const t of all) tf.set(t, (tf.get(t) ?? 0) + 1);

      return {
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

    const df = new Map<string, number>();
    for (const c of indexed) for (const t of c.terms) df.set(t, (df.get(t) ?? 0) + 1);

    const N = Math.max(1, indexed.length);
    const idf = new Map<string, number>();
    for (const [term, freq] of df) {
      // Smoothed IDF, floored at a small positive value so a term present in
      // every document still contributes a little rather than exactly nothing.
      idf.set(term, Math.max(0.05, Math.log(1 + (N - freq + 0.5) / (freq + 0.5))));
    }

    this.index = indexed;
    this.idf = idf;
    this.avgLength = indexed.length
      ? indexed.reduce((s, c) => s + c.length, 0) / indexed.length
      : 1;
    this.ready = true;

    this.log.log(`index rebuilt: ${indexed.length} chunks, ${idf.size} terms`);
  }

  /** IDF for an unseen term — treat it as maximally informative and absent. */
  private idfOf(term: string): number {
    return this.idf.get(term) ?? Math.log(1 + this.index.length);
  }

  async search(params: {
    query: string;
    limit?: number;
    category?: Skill;
  }): Promise<KnowledgeSearchResult[]> {
    if (!this.ready) await this.rebuild();
    const limit = params.limit ?? 4;

    const queryTerms = expand(tokenize(params.query));
    if (queryTerms.length === 0) return [];

    // Deduplicate; a repeated word shouldn't count twice toward coverage.
    const uniqueQueryTerms = [...new Set(queryTerms)];
    const queryVec = embed(params.query);

    const k1 = 1.4;
    const b = 0.7;

    const scored = this.index
      .filter((c) => !params.category || c.category === params.category)
      .map((c) => {
        // BM25 for ranking.
        let bm25 = 0;
        for (const term of uniqueQueryTerms) {
          const f = c.tf.get(term);
          if (!f) continue;
          const norm = 1 - b + b * (c.length / this.avgLength);
          bm25 += this.idfOf(term) * ((f * (k1 + 1)) / (f + k1 * norm));
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
    const totalIdf = uniqueQueryTerms.reduce((s, t) => s + this.idfOf(t), 0);

    return scored.map(({ c, score }) => {
      const covered = uniqueQueryTerms
        .filter((t) => c.terms.has(t))
        .reduce((s, t) => s + this.idfOf(t), 0);
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
