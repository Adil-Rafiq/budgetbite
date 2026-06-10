'use client';

import { useState } from 'react';
import type { ScraperRun } from '@repo/shared';
import { useAdminScraperRuns } from '@/hooks/use-admin-scraper-runs';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PAGE_SIZE = 25;

const statusClass: Record<ScraperRun['status'], string> = {
  running: 'bg-amber/15 text-amber',
  succeeded: 'bg-fathom/10 text-fathom',
  failed: 'bg-pulse/10 text-pulse',
};

function duration(run: ScraperRun): string {
  if (!run.finishedAt) return '—';
  const ms = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();
  if (ms < 0) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export default function AdminIngestionPage() {
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError } = useAdminScraperRuns({ limit: PAGE_SIZE, offset });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl">
      <h1
        className="text-vast"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: '-0.02em',
        }}
      >
        Ingestion
      </h1>
      <p className="mt-1 text-[14px] text-ink">
        Scraper runs and how much data each one brought in.
      </p>

      <div className="mt-6 rounded-xl border border-lumen-dk bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-soft" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-[14px] text-soft">
            Could not load scraper runs. Try again.
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-soft">No scraper runs yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Started</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Restaurants</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="text-soft">
                    {new Date(run.startedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${statusClass[run.status]}`}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {run.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-ink">
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{run.source}</span>
                    {run.area && <span className="ml-2 text-soft">{run.area}</span>}
                  </TableCell>
                  <TableCell className="text-right text-ink">{run.restaurantsUpserted}</TableCell>
                  <TableCell className="text-right text-ink">{run.itemsUpserted}</TableCell>
                  <TableCell className="text-right text-soft">{duration(run)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[12px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
