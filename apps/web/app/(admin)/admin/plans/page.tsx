'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AdminPlanGeneration } from '@repo/shared';
import { useAdminPlans } from '@/hooks/use-admin-plans';
import { formatPKR } from '@/lib/currency';
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

const PAGE_SIZE = 20;

const money = (n: number): string => formatPKR(n);

const genStatusClass: Record<AdminPlanGeneration['status'], string> = {
  pending: 'bg-amber-tint text-amber-ink',
  succeeded: 'bg-teal/15 text-teal-ink',
  failed: 'bg-tomato/10 text-tomato-ink',
  superseded: 'bg-sand/50 text-slate-muted',
};

export default function AdminPlansPage() {
  const [status, setStatus] = useState<string>('all');
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isError, refetch } = useAdminPlans({
    limit: PAGE_SIZE,
    offset,
    status: status === 'all' ? undefined : (status as 'active' | 'completed' | 'cancelled'),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[26px] font-semibold tracking-tight text-charcoal">Plans</h1>
      <p className="mt-1 text-[14px] text-slate">
        Inspect AI-generated budget plans across all users.
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setOffset(0);
          }}
        >
          <SelectTrigger aria-label="Filter by plan status" className="w-40 bg-surface">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
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
          <DataError message="Could not load plans." onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-slate-muted">No plans match.</div>
        ) : (
          <Table>
            {/* Named for screen readers: the visible heading sits outside the
                table, so without this the table announces only its column count. */}
            <TableCaption className="sr-only">
              Budget plans, with owner, budget and status.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latest gen</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      href={`/admin/plans/${p.id}`}
                      className="font-medium text-charcoal hover:text-teal-ink"
                    >
                      {p.user.name}
                    </Link>
                    <span className="ml-2 text-[12px] text-slate-muted">{p.user.email}</span>
                  </TableCell>
                  <TableCell className="text-slate">{p.planType}</TableCell>
                  <TableCell className="text-right text-slate">{money(p.totalBudget)}</TableCell>
                  <TableCell className="text-slate-muted">{p.status}</TableCell>
                  <TableCell>
                    {p.latestAttempt ? (
                      <span
                        className={`font-mono inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${genStatusClass[p.latestAttempt.status]}`}
                      >
                        {p.latestAttempt.status}
                      </span>
                    ) : (
                      <span className="text-slate-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-muted">
                    {new Date(p.createdAt).toLocaleDateString()}
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
          itemLabel="plans"
          onPrevious={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          onNext={() => setOffset((o) => o + PAGE_SIZE)}
        />
      )}
    </div>
  );
}
