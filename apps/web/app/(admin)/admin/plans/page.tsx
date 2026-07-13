'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AdminPlanGeneration } from '@repo/shared';
import { useAdminPlans } from '@/hooks/use-admin-plans';
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

const PAGE_SIZE = 20;

const money = (n: number): string => `₨ ${n.toLocaleString()}`;

const genStatusClass: Record<AdminPlanGeneration['status'], string> = {
  pending: 'bg-[#f5a623]/15 text-[#9a6400]',
  succeeded: 'bg-green/15 text-dark-green',
  failed: 'bg-tomato/10 text-tomato',
  superseded: 'bg-sage/50 text-slate/60',
};

export default function AdminPlansPage() {
  const [status, setStatus] = useState<string>('all');
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isError } = useAdminPlans({
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
          <SelectTrigger className="w-40 bg-white">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        {total > 0 && <span className="font-mono text-[12px] text-slate/60">{total} total</span>}
      </div>

      <div className="mt-4 rounded-xl border border-sage bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-slate/60" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-[14px] text-slate/60">
            Could not load plans. Try again.
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-slate/60">No plans match.</div>
        ) : (
          <Table>
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
                      className="font-medium text-charcoal hover:text-dark-green"
                    >
                      {p.user.name}
                    </Link>
                    <span className="ml-2 text-[12px] text-slate/60">{p.user.email}</span>
                  </TableCell>
                  <TableCell className="text-slate">{p.planType}</TableCell>
                  <TableCell className="text-right text-slate">{money(p.totalBudget)}</TableCell>
                  <TableCell className="text-slate/60">{p.status}</TableCell>
                  <TableCell>
                    {p.latestAttempt ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${genStatusClass[p.latestAttempt.status]}`}
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {p.latestAttempt.status}
                      </span>
                    ) : (
                      <span className="text-slate/60">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate/60">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-[12px] text-slate/60">
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
