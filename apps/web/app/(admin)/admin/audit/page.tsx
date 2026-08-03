'use client';

import { useState } from 'react';
import { useAdminAuditLogs } from '@/hooks/use-admin-audit-logs';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

// Entity types that currently emit audit entries.
const ENTITY_TYPES = ['restaurant', 'menu-item', 'meal-type', 'user'] as const;

export default function AdminAuditPage() {
  const [entityType, setEntityType] = useState<string>('all');
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isError, refetch } = useAdminAuditLogs({
    limit: PAGE_SIZE,
    offset,
    entityType: entityType === 'all' ? undefined : entityType,
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[26px] font-semibold tracking-tight text-charcoal">
        Audit log
      </h1>
      <p className="mt-1 text-[14px] text-slate">
        Every create, update, and delete performed by an admin or the scraper.
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Select
          value={entityType}
          onValueChange={(v) => {
            setEntityType(v);
            setOffset(0);
          }}
        >
          <SelectTrigger aria-label="Filter by entity type" className="w-44 bg-surface">
            <SelectValue placeholder="All entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {ENTITY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {total > 0 && <span className="font-mono text-[12px] text-slate-muted">{total} total</span>}
      </div>

      <div className={isError ? 'mt-4' : 'mt-4 rounded-xl border border-sand bg-surface'}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-slate-muted" />
          </div>
        ) : isError ? (
          <DataError message="Could not load the audit log." onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-slate-muted">
            No activity recorded yet.
          </div>
        ) : (
          <Table>
            {/* Named for screen readers: the visible heading sits outside the
                table, so without this the table announces only its column count. */}
            <TableCaption className="sr-only">
              Admin and scraper mutations, newest first.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-slate-muted">
                    {new Date(entry.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-slate">
                    {entry.actorType === 'service' ? (
                      <span className="font-mono">scraper</span>
                    ) : (
                      (entry.actorName ?? '—')
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-sand/50 px-2 py-0.5 font-mono text-[11px] text-slate">
                      {entry.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-muted">
                    <span className="font-mono">{entry.entityType}</span>
                    {/* Truncated to stay scannable, but the full id is on the
                        element: the log's purpose is tracing one record, and
                        eight characters with no way to see the rest made that
                        impossible. `text-slate/50` was also 2.4:1. */}
                    {entry.entityId && (
                      <span
                        title={entry.entityId}
                        className="ml-2 font-mono text-[12px] text-slate-muted"
                      >
                        {entry.entityId.slice(0, 8)}
                        <span className="sr-only">{entry.entityId.slice(8)}</span>
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {total > PAGE_SIZE && (
        <AdminPagination
          page={page}
          pageCount={pageCount}
          itemLabel="log entries"
          onPrevious={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          onNext={() => setOffset((o) => o + PAGE_SIZE)}
        />
      )}
    </div>
  );
}
