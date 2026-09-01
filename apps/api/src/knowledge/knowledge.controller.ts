import { Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import {
  type KnowledgeDocDto,
  type KnowledgeSearchResult,
  Skill,
  UpsertKnowledgeDocInput,
} from '@superdemo/contracts';
import { KnowledgeService } from './knowledge.service';
import { Roles } from '../auth/guards';
import { ZodBody, ZodQuery } from '../shared/zod.pipe';

const SearchQuery = z.object({
  q: z.string().min(1).max(400),
  limit: z.coerce.number().int().min(1).max(20).default(4),
  category: Skill.optional(),
});

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get()
  list(): Promise<KnowledgeDocDto[]> {
    return this.knowledge.list();
  }

  /**
   * Exposed so the AI-agent config page can show a live "what would the
   * assistant retrieve for this question, and how confident is it?" preview.
   * Being able to test the KB without placing a call is what makes it
   * maintainable by the client's own staff.
   */
  @Get('search')
  search(@ZodQuery(SearchQuery) q: z.infer<typeof SearchQuery>): Promise<KnowledgeSearchResult[]> {
    return this.knowledge.search({ query: q.q, limit: q.limit, category: q.category });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.knowledge.get(id);
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Post()
  create(@ZodBody(UpsertKnowledgeDocInput) body: UpsertKnowledgeDocInput): Promise<KnowledgeDocDto> {
    return this.knowledge.create(body);
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Put(':id')
  update(
    @Param('id') id: string,
    @ZodBody(UpsertKnowledgeDocInput) body: UpsertKnowledgeDocInput,
  ): Promise<KnowledgeDocDto> {
    return this.knowledge.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.knowledge.remove(id);
  }

  @Roles('ADMIN')
  @Post('reindex')
  @HttpCode(200)
  async reindex(): Promise<{ ok: true }> {
    await this.knowledge.rebuild();
    return { ok: true };
  }
}
