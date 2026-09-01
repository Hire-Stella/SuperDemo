import { Controller, Get, Param, Patch } from '@nestjs/common';
import {
  type ConversationDetail,
  type ConversationListItem,
  ListConversationsQuery,
  UpdateConversationInput,
} from '@superdemo/contracts';
import { ConversationsService } from './conversations.service';
import { ZodBody, ZodQuery } from '../shared/zod.pipe';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(
    @ZodQuery(ListConversationsQuery) query: ListConversationsQuery,
  ): Promise<{ items: ConversationListItem[]; nextCursor: string | null }> {
    return this.conversations.list(query);
  }

  @Get(':id')
  detail(@Param('id') id: string): Promise<ConversationDetail> {
    return this.conversations.detail(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @ZodBody(UpdateConversationInput) body: UpdateConversationInput,
  ): Promise<ConversationListItem> {
    return this.conversations.update(id, body);
  }
}
