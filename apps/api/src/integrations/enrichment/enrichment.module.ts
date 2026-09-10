import { Global, Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { GeneratorService } from './generator.service';
import { EnrichmentService } from './enrichment.service';

/**
 * Global because the platform controller enqueues enrichment inside the
 * create-centre transaction, and the website editor re-runs it — two callers in
 * unrelated modules.
 */
@Global()
@Module({
  providers: [ScraperService, GeneratorService, EnrichmentService],
  exports: [ScraperService, GeneratorService, EnrichmentService],
})
export class EnrichmentModule {}
