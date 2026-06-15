'use client';

import { useState } from 'react';
import { can, type AdminRestaurantRecommendation } from '@repo/shared';
import { useUser } from '@/hooks/use-user';
import {
  useAdminRecommendations,
  useReviewRecommendation,
} from '@/hooks/use-admin-recommendations';
import { RestaurantFormModal } from '../../_components/restaurant-form-modal';
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
  pending: 'bg-amber/[0.12] text-amber',
  approved: 'bg-fathom/10 text-fathom',
  rejected: 'bg-pulse/10 text-pulse',
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
      <h1
        className="text-vast"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: '-0.02em',
        }}
      >
        Recommendations
      </h1>
      <p className="mt-1 text-[14px] text-ink">
        Restaurants suggested by users. Approve to add one to the catalogue, or reject it.
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
            Could not load recommendations. Try again.
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-soft">
            No recommendations{statusFilter !== 'all' ? ` are ${statusFilter}` : ''}.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
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
                    <div className="flex flex-col">
                      <span className="font-medium text-vast">{r.name}</span>
                      {r.link && (
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-[12px] text-fathom underline-offset-2 hover:underline"
                        >
                          link
                        </a>
                      )}
                      {r.note && <span className="mt-0.5 text-[12px] text-soft">{r.note}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-ink">
                    <div className="flex flex-col">
                      <span>{r.user.name}</span>
                      <span
                        className="text-[11px] text-soft"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {r.user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-soft">{r.area ?? '—'}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${STATUS_PILL[r.status]}`}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {r.status}
                    </span>
                    {r.adminNote && (
                      <span className="mt-1 block text-[11px] text-soft">{r.adminNote}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-soft">
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
                            Approve &amp; add
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
                        <span className="text-[12px] text-soft">
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

      {/* Approve & add — opens the Create-Restaurant form prefilled from the recommendation. */}
      {approving && (
        <RestaurantFormModal
          open={!!approving}
          onOpenChange={(open) => {
            if (!open) setApproving(null);
          }}
          defaultValues={{
            name: approving.name,
            latitude: approving.latitude ?? undefined,
            longitude: approving.longitude ?? undefined,
          }}
          onCreated={(created) => {
            review.mutate({
              id: approving.id,
              input: { status: 'approved', createdRestaurantId: created.id },
            });
            setApproving(null);
          }}
        />
      )}

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
