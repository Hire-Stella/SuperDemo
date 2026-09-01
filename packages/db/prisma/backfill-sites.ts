/**
 * Give every existing centre a landing page.
 *
 * Landing pages are provisioned with new centres, and the API creates one
 * lazily the first time anybody reads a centre's page — but "lazily" means a
 * platform operator's list shows a column of blanks until someone happens to
 * visit each one, which reads as the feature not working. This fills them in.
 *
 * Idempotent: a centre that already has a page is left completely alone,
 * including its edits. Safe to run after adding a template or changing the
 * starter copy — it will not overwrite anybody's work.
 *
 *   pnpm --filter @superdemo/db exec tsx prisma/backfill-sites.ts
 *   pnpm --filter @superdemo/db exec tsx prisma/backfill-sites.ts --dry
 */
import { PrismaClient } from '@prisma/client';
import {
  defaultStyleForIndustry,
  defaultTemplateForIndustry,
  siteContentForIndustry,
} from '@superdemo/contracts';

const dry = process.argv.includes('--dry');
const prisma = new PrismaClient();

async function main(): Promise<void> {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: 'asc' },
    include: { site: { select: { id: true, template: true } } },
  });

  let created = 0;
  for (const org of orgs) {
    if (org.site) {
      console.log(`  skip    ${org.slug.padEnd(26)} already has a ${org.site.template} page`);
      continue;
    }

    const template = defaultTemplateForIndustry(org.industry);
    if (dry) {
      console.log(`  would   ${org.slug.padEnd(26)} → ${template} (${org.industry})`);
      continue;
    }

    await prisma.site.create({
      data: {
        orgId: org.id,
        template,
        style: defaultStyleForIndustry(org.industry),
        content: siteContentForIndustry(org.industry, org.name),
        metaTitle: `${org.name}${org.tagline ? ` · ${org.tagline}` : ''}`,
      },
    });
    created++;
    console.log(`  created ${org.slug.padEnd(26)} → ${template} (${org.industry})`);
  }

  console.log(
    dry
      ? `\n  dry run — ${orgs.filter((o) => !o.site).length} centre(s) would get a page`
      : `\n  ${created} page(s) created, ${orgs.length - created} left untouched`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
