'use client';

import { Fragment, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import type { ScraperRun } from '@repo/shared';
import { useAdminScraperRuns } from '@/hooks/use-admin-scraper-runs';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableCaption,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataError } from '@/components/data-error';
import { AdminPagination } from '../../_components/admin-pagination';

const PAGE_SIZE = 25;

const statusClass: Record<ScraperRun['status'], string> = {
  running: 'bg-amber-tint text-amber-ink',
  succeeded: 'bg-teal/15 text-teal-ink',
  failed: 'bg-tomato/10 text-tomato-ink',
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

/**
 * Where a run was pointed.
 *
 * `area` is optional on the contract, and a run without one used to render as
 * nothing at all — leaving a failed run geographically anonymous when "which
 * area is broken" is the first question asked. The coordinates are on the
 * record either way, so fall back to them rather than to blank.
 */
function location(run: ScraperRun): string | null {
  if (run.area) return run.area;
  if (run.latitude !== null && run.longitude !== null) {
    return `${run.latitude.toFixed(4)}, ${run.longitude.toFixed(4)}`;
  }
  return null;
}

export default function AdminIngestionPage() {
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError, refetch } = useAdminScraperRuns({ limit: PAGE_SIZE, offset });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[26px] font-semibold tracking-tight text-charcoal">
        Ingestion
      </h1>
      <p className="mt-1 text-[14px] text-slate">
        Scraper runs and how much data each one brought in.
      </p>

      <div className={isError ? 'mt-6' : 'mt-6 rounded-xl border border-sand bg-surface'}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-slate-muted" />
          </div>
        ) : isError ? (
          <DataError message="Could not load scraper runs." onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-slate-muted">No scraper runs yet.</div>
        ) : (
          <Table>
            {/* Named for screen readers: the visible heading sits outside the
                table, so without this the table announces only its column count. */}
            <TableCaption className="sr-only">
              Scraper runs, newest first, with volume and failure reasons.
            </TableCaption>
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
              {rows.map((run) => {
                const where = location(run);
                const failed = run.status === 'failed';
                return (
                  <Fragment key={run.id}>
                    <TableRow className={failed ? 'border-b-0' : undefined}>
                      <TableCell className="text-slate-muted">
                        {new Date(run.startedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] ${statusClass[run.status]}`}
                        >
                          {run.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate">
                        <span className="font-mono">{run.source}</span>
                        {where && <span className="ml-2 text-slate-muted">{where}</span>}
                      </TableCell>
                      <TableCell className="text-right text-slate">
                        {run.restaurantsUpserted}
                      </TableCell>
                      <TableCell className="text-right text-slate">{run.itemsUpserted}</TableCell>
                      <TableCell className="text-right text-slate-muted">{duration(run)}</TableCell>
                    </TableRow>

                    {/* The reason, always open rather than behind a disclosure.
                        This page exists to answer "why did ingestion break",
                        and it previously rendered the word `failed` and threw
                        `errorMessage` away — sending the operator to the
                        server logs, i.e. out of the product. */}
                    {failed && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={6} className="whitespace-normal pt-0 align-top">
                          <div className="flex items-start gap-2 rounded-lg border border-tomato/30 bg-tomato/[0.06] px-3 py-2 text-[12px] text-tomato-ink">
                            <TriangleAlert aria-hidden className="mt-px h-3.5 w-3.5 shrink-0" />
                            <span className="min-w-0 break-words font-mono leading-relaxed">
                              {run.errorMessage ?? 'Failed with no reason recorded.'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {total > PAGE_SIZE && (
        <AdminPagination
          page={page}
          pageCount={pageCount}
          itemLabel="scraper runs"
          onPrevious={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          onNext={() => setOffset((o) => o + PAGE_SIZE)}
        />
      )}
    </div>
  );
}
