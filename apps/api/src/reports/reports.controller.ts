import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AnalyticsRangeQuery, ListConversationsQuery } from '@superdemo/contracts';
import { ReportsService } from './reports.service';
import { Roles } from '../auth/guards';
import { ZodQuery } from '../shared/zod.pipe';

/**
 * Downloads.
 *
 * Filenames are server-chosen and sanitised: they end up in a Content-Disposition
 * header, where an unescaped quote or newline from a contact name would let a
 * caller control the response headers.
 */
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  private send(res: Response, file: { filename: string; body: string }, mime: string): void {
    const safe = file.filename.replace(/[^A-Za-z0-9._-]/g, '_');
    res.setHeader('content-type', `${mime}; charset=utf-8`);
    res.setHeader('content-disposition', `attachment; filename="${safe}"`);
    // Excel needs a BOM to read UTF-8 CSV correctly, otherwise Arabic names and
    // accented characters arrive mangled.
    res.send(mime === 'text/csv' ? `﻿${file.body}` : file.body);
  }

  /** Anyone who can see the conversation can export its transcript. */
  @Get('transcript/:conversationId')
  async transcript(@Param('conversationId') id: string, @Res() res: Response): Promise<void> {
    this.send(res, await this.reports.transcriptText(id), 'text/plain');
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Get('conversations.csv')
  async conversationsCsv(
    @ZodQuery(ListConversationsQuery) query: ListConversationsQuery,
    @Res() res: Response,
  ): Promise<void> {
    this.send(res, await this.reports.conversationsCsv(query), 'text/csv');
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Get('analytics.csv')
  async analyticsCsv(
    @ZodQuery(AnalyticsRangeQuery) query: AnalyticsRangeQuery,
    @Res() res: Response,
  ): Promise<void> {
    this.send(res, await this.reports.analyticsCsv(query), 'text/csv');
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Get('agents.csv')
  async agentsCsv(
    @ZodQuery(AnalyticsRangeQuery) query: AnalyticsRangeQuery,
    @Res() res: Response,
  ): Promise<void> {
    this.send(res, await this.reports.agentsCsv(query), 'text/csv');
  }
}
