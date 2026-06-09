import { desc, eq, sql } from 'drizzle-orm';

import { db } from '../db.js';
import {
  scraperRun,
  type NewScraperRun,
  type ScraperRun,
  type UpdateScraperRun,
} from '../schema/index.js';

export const scraperRunRepository = {
  async create(data: NewScraperRun): Promise<ScraperRun> {
    const [row] = await db.insert(scraperRun).values(data).returning();
    if (!row) throw new Error('Scraper run insert failed');
    return row;
  },

  async update(id: string, data: UpdateScraperRun): Promise<ScraperRun> {
    const [row] = await db.update(scraperRun).set(data).where(eq(scraperRun.id, id)).returning();
    if (!row) throw new Error('Scraper run not found');
    return row;
  },

  async findById(id: string): Promise<ScraperRun | undefined> {
    const [row] = await db.select().from(scraperRun).where(eq(scraperRun.id, id)).limit(1);
    return row;
  },

  async list(limit = 50, offset = 0): Promise<ScraperRun[]> {
    return db
      .select()
      .from(scraperRun)
      .orderBy(desc(scraperRun.startedAt))
      .limit(limit)
      .offset(offset);
  },

  async count(): Promise<number> {
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(scraperRun);
    return row?.count ?? 0;
  },
};
