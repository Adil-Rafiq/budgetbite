'use client';

import { useState } from 'react';
import { useAdminAuditLogs } from '@/hooks/use-admin-audit-logs';
import { Button } from '@/components/ui/button';
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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PAGE_SIZE = 25;

// Entity types that currently emit audit entries.
const ENTITY_TYPES = ['restaurant', 'menu-item', 'meal-type', 'user'] as const;

export default function AdminAuditPage() {
  const [entityType, setEntityType] = useState<string>('all');
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isError } = useAdminAuditLogs({
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
      <h1
        className="text-vast"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: '-0.02em',
        }}
      >
        Audit log
      </h1>
      <p className="mt-1 text-[14px] text-ink">
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
          <SelectTrigger className="w-44 bg-white">
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
        {total > 0 && (
          <span className="text-[12px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
            {total} total
          </span>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-lumen-dk bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-soft" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-[14px] text-soft">
            Could not load the audit log. Try again.
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-soft">No activity recorded yet.</div>
        ) : (
          <Table>
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
                  <TableCell className="text-soft">
                    {new Date(entry.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-ink">
                    {entry.actorType === 'service' ? (
                      <span style={{ fontFamily: 'var(--font-mono)' }}>scraper</span>
                    ) : (
                      (entry.actorName ?? '—')
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center rounded-full bg-lumen-dk/40 px-2 py-0.5 text-[11px] text-ink"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {entry.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-soft">
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{entry.entityType}</span>
                    {entry.entityId && (
                      <span className="ml-2 text-[12px] text-soft/70">
                        {entry.entityId.slice(0, 8)}
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
