'use client';

import { useState } from 'react';
import { can, type AdminRestaurantRecommendation } from '@repo/shared';
import { useUser } from '@/hooks/use-user';
import {
  useAdminRecommendations,
  useReviewRecommendation,
} from '@/hooks/use-admin-recommendations';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PAGE_SIZE = 20;

const STATUS_PILL: Record<string, string> = {
  pending: 'bg-[#f5a623]/15 text-[#9a6400]',
  approved: 'bg-green/15 text-dark-green',
  rejected: 'bg-tomato/10 text-tomato',
};

export default function AdminRecommendationsPage() {
  const { data: currentUser } = useUser();
  const canWrite = currentUser ? can(currentUser.role, 'recommendation:write') : false;

  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [offset, setOffset] = useState(0);

  const [approving, setApproving] = useState<AdminRestaurantRecommendation | null>(null);
  const [rejecting, setRejecting] = useState<AdminRestaurantRecommendation | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const { data, isLoading, isError } = useAdminRecommendations({
    limit: PAGE_SIZE,
    offset,
    status:
      statusFilter === 'all' ? undefined : (statusFilter as 'pending' | 'approved' | 'rejected'),
  });

  const review = useReviewRecommendation();

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const confirmApprove = () => {
    if (!approving) return;
    review.mutate(
      { id: approving.id, input: { status: 'approved' } },
      { onSuccess: () => setApproving(null) },
    );
  };

  const confirmReject = () => {
    if (!rejecting) return;
    review.mutate(
      {
        id: rejecting.id,
        input: { status: 'rejected', adminNote: rejectNote.trim() || undefined },
      },
      {
        onSuccess: () => {
          setRejecting(null);
          setRejectNote('');
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[26px] font-semibold tracking-tight text-charcoal">
        Recommendations
      </h1>
      <p className="mt-1 text-[14px] text-slate">
        Restaurants suggested by users, with the menu items they provided. Approving creates the
        restaurant and its menu automatically.
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-40 bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {total > 0 && (
          <span className="text-[12px] text-slate/60" style={{ fontFamily: 'var(--font-mono)' }}>
            {total} total
          </span>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-sage bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-slate/60" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-[14px] text-slate/60">
            Could not load recommendations. Try again.
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-slate/60">
            No recommendations{statusFilter !== 'all' ? ` are ${statusFilter}` : ''}.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant &amp; items</TableHead>
                <TableHead>Submitted by</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>When</TableHead>
                {canWrite && <TableHead className="w-48" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-charcoal">{r.name}</span>
                      {r.link && (
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] text-dark-green underline-offset-2 hover:underline"
                        >
                          link
                        </a>
                      )}
                      {r.phone && (
                        <span
                          className="text-[12px] text-slate/60"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {r.phone}
                        </span>
                      )}
                      {r.items.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {r.items.slice(0, 6).map((it, idx) => (
                            <span
                              key={idx}
                              className="rounded border border-sage bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-slate"
                            >
                              {it.name} ₨{it.price}
                            </span>
                          ))}
                          {r.items.length > 6 && (
                            <span className="text-[11px] text-slate/60">
                              +{r.items.length - 6} more
                            </span>
                          )}
                        </div>
                      )}
                      {r.note && <span className="text-[12px] text-slate/60">{r.note}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate">
                    <div className="flex flex-col">
                      <span>{r.user.name}</span>
                      <span
                        className="text-[11px] text-slate/60"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {r.user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate/60">
                    <div className="flex flex-col gap-1">
                      <span>{r.area ?? '—'}</span>
                      {r.latitude != null && r.longitude != null && (
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=17/${r.latitude}/${r.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] text-dark-green underline-offset-2 hover:underline"
                        >
                          view on map
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${STATUS_PILL[r.status]}`}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {r.status}
                    </span>
                    {r.adminNote && (
                      <span className="mt-1 block text-[11px] text-slate/60">{r.adminNote}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate/60">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </TableCell>
                  {canWrite && (
                    <TableCell>
                      {r.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={review.isPending}
                            onClick={() => setApproving(r)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={review.isPending}
                            onClick={() => {
                              setRejectNote('');
                              setRejecting(r);
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[12px] text-slate/60">
                          {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : 'reviewed'}
                        </span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[12px] text-slate/60" style={{ fontFamily: 'var(--font-mono)' }}>
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

      {/* Approve — one click creates the restaurant + its menu items. */}
      <AlertDialog
        open={!!approving}
        onOpenChange={(open) => {
          if (!open) setApproving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve “{approving?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This creates the restaurant and its {approving?.items.length ?? 0} menu item
              {approving?.items.length === 1 ? '' : 's'}, using the submitter’s saved location. You
              can edit details afterward on the restaurant page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApprove} disabled={review.isPending}>
              Approve &amp; create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject — optional note. */}
      <AlertDialog
        open={!!rejecting}
        onOpenChange={(open) => {
          if (!open) {
            setRejecting(null);
            setRejectNote('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject “{rejecting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Optionally leave a note (e.g. why it wasn’t added). The user won’t be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            rows={3}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Reason (optional)"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject} disabled={review.isPending}>
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
