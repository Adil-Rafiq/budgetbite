'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { can, type Restaurant } from '@repo/shared';
import { useUser } from '@/hooks/use-user';
import {
  useAdminRestaurants,
  useBulkDeleteAdminRestaurants,
  useDeleteAdminRestaurant,
  type BulkDeleteTarget,
} from '@/hooks/use-admin-restaurants';
import { RestaurantFormModal } from '../../_components/restaurant-form-modal';
import { adminApi } from '@/lib/api/endpoints/admin';
import { getErrorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';
import { FOCUS_RING } from '@/lib/focus-ring';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatPKR } from '@/lib/currency';
import { DataError } from '@/components/data-error';
import { AdminPagination } from '../../_components/admin-pagination';

const PAGE_SIZE = 20;

const money = (n: number | null): string => (n == null ? '—' : formatPKR(n));

const csvCell = (v: unknown): string => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default function AdminRestaurantsPage() {
  const { data: user } = useUser();
  const canDelete = user ? can(user.role, 'restaurant:delete') : false;
  const canWrite = user ? can(user.role, 'restaurant:write') : false;

  const [form, setForm] = useState<{ open: boolean; restaurant?: Restaurant }>({ open: false });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [offset, setOffset] = useState(0);
  /**
   * id → name, rather than a bare id set.
   *
   * The name is carried so a confirmation dialog can say *which* restaurants
   * are about to be destroyed even after the operator has paged past them —
   * and so selection can outlive a page change at all. It used to be cleared
   * on every `offset` change, which quietly capped every bulk action at the
   * twenty rows on screen.
   */
  const [selected, setSelected] = useState<Map<string, string>>(new Map());
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // A new search is a new working set, so the old selection no longer means
  // anything. Paging within one search keeps it.
  useEffect(() => {
    setSelected(new Map());
  }, [debouncedSearch]);

  const { data, isLoading, isError, refetch } = useAdminRestaurants({
    limit: PAGE_SIZE,
    offset,
    q: debouncedSearch || undefined,
  });

  const deleteRestaurant = useDeleteAdminRestaurant();
  const bulkDelete = useBulkDeleteAdminRestaurants((done, total) => setProgress({ done, total }));

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const selectedTargets: BulkDeleteTarget[] = Array.from(selected, ([id, name]) => ({ id, name }));
  const selectedNames = selectedTargets.map((t) => t.name);
  const selectedOffPage = selectedTargets.filter((t) => !rows.some((r) => r.id === t.id)).length;

  const toggleRow = (r: Restaurant) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(r.id)) next.delete(r.id);
      else next.set(r.id, r.name);
      return next;
    });

  const toggleAllOnPage = () =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (rows.every((r) => next.has(r.id))) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.set(r.id, r.name));
      return next;
    });

  /**
   * Export every restaurant matching the current search, not the visible page.
   *
   * This used to map `rows` — the twenty rows on screen — and hand the result
   * over as `restaurants.csv` while "1000 total" sat next to the button. The
   * file was silently wrong, in the one direction nobody checks: it looked
   * complete. The page size ceiling is 100, so walk it.
   */
  const exportCsv = async () => {
    setExporting(true);
    try {
      const header = [
        'id',
        'name',
        'rating',
        'deliveryFee',
        'minimumOrder',
        'ratingCount',
        'createdAt',
      ];

      const CHUNK = 100;
      const all: Restaurant[] = [];
      for (let cursor = 0; ; cursor += CHUNK) {
        const page = await adminApi.listRestaurants({
          limit: CHUNK,
          offset: cursor,
          q: debouncedSearch || undefined,
        });
        all.push(...page.data);
        if (all.length >= page.meta.total || page.data.length === 0) break;
      }

      const lines = all.map((r) =>
        [
          r.id,
          r.name,
          r.rating ?? '',
          r.deliveryFee ?? '',
          r.minimumOrder ?? '',
          r.ratingCount,
          new Date(r.createdAt).toISOString(),
        ]
          .map(csvCell)
          .join(','),
      );
      const csv = [header.join(','), ...lines].join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = debouncedSearch ? 'restaurants-filtered.csv' : 'restaurants.csv';
      a.click();
      URL.revokeObjectURL(url);
      showToast.success({
        title: `Exported ${all.length} restaurant${all.length === 1 ? '' : 's'}`,
      });
    } catch (err) {
      showToast.error({ title: 'Could not export', description: getErrorMessage(err) });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[26px] font-semibold tracking-tight text-charcoal">
        Restaurants
      </h1>
      <p className="mt-1 text-[14px] text-slate">
        Browse, edit, and remove restaurants and their menu items.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Label htmlFor="restaurant-search" className="sr-only">
            Search restaurants by name
          </Label>
          <Input
            id="restaurant-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="max-w-xs bg-white"
          />
          {total > 0 && (
            <span className="shrink-0 font-mono text-[12px] text-slate-muted">{total} total</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {rows.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
              {exporting ? <Spinner className="size-4" /> : <Download className="size-4" />}
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          )}
          {canWrite && (
            <Button size="sm" onClick={() => setForm({ open: true })}>
              <Plus className="size-4" />
              Add restaurant
            </Button>
          )}
        </div>
      </div>

      {/* Bulk actions live in their own bar rather than in the toolbar above.
          The Delete button used to mount and unmount inside that row, shifting
          Export and Add sideways every time a checkbox was ticked. */}
      {canDelete && selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-sand bg-white px-4 py-3">
          <span className="text-[13px] text-charcoal">
            <span className="font-mono font-semibold tabular-nums">{selected.size}</span> selected
            {selectedOffPage > 0 && (
              <span className="text-slate-muted"> ({selectedOffPage} on other pages)</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setSelected(new Map())}
            className={`rounded text-[13px] text-slate underline-offset-2 transition-colors hover:text-charcoal hover:underline ${FOCUS_RING}`}
          >
            Clear
          </button>
          <div className="ml-auto flex items-center gap-3">
            {bulkDelete.isPending && progress && (
              <span role="status" className="font-mono text-[12px] tabular-nums text-slate">
                Deleting {progress.done} / {progress.total}…
              </span>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={bulkDelete.isPending}>
                  {bulkDelete.isPending ? (
                    <Spinner className="size-4" />
                  ) : (
                    <Trash2 className="size-4 text-destructive" />
                  )}
                  Delete {selected.size}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {selected.size} restaurant{selected.size === 1 ? '' : 's'}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {/* Naming the restaurants and the cascade, because the
                        previous copy asked the operator to confirm an unnamed
                        set and never mentioned that the menu items go too. */}
                    This also deletes every menu item under {selected.size === 1 ? 'it' : 'them'},
                    and cannot be undone.
                    {selectedNames.length > 0 && (
                      <span className="mt-2 block text-charcoal">
                        {selectedNames.slice(0, 5).join(', ')}
                        {selectedNames.length > 5 && `, and ${selectedNames.length - 5} more`}
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => {
                      setProgress({ done: 0, total: selectedTargets.length });
                      bulkDelete.mutate(selectedTargets, {
                        onSuccess: () => setSelected(new Map()),
                        onSettled: () => setProgress(null),
                      });
                    }}
                  >
                    Delete {selected.size}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      <div className={isError ? 'mt-4' : 'mt-4 rounded-xl border border-sand bg-white'}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-slate-muted" />
          </div>
        ) : isError ? (
          <DataError message="Could not load restaurants." onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-slate-muted">
            {debouncedSearch ? 'No restaurants match your search.' : 'No restaurants yet.'}
          </div>
        ) : (
          <Table>
            {/* Named for screen readers: the visible heading sits outside the
                table, so without this the table announces only its column count. */}
            <TableCaption className="sr-only">
              Restaurants, with rating, fees and date added.
            </TableCaption>
            <TableHeader>
              <TableRow>
                {canDelete && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allOnPageSelected}
                      onCheckedChange={toggleAllOnPage}
                      aria-label="Select all on page"
                    />
                  </TableHead>
                )}
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">Delivery</TableHead>
                <TableHead className="text-right">Min order</TableHead>
                <TableHead>Added</TableHead>
                {(canWrite || canDelete) && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const isDeleting =
                  deleteRestaurant.isPending && deleteRestaurant.variables === r.id;
                return (
                  <TableRow key={r.id} data-state={selected.has(r.id) ? 'selected' : undefined}>
                    {canDelete && (
                      <TableCell>
                        <Checkbox
                          checked={selected.has(r.id)}
                          onCheckedChange={() => toggleRow(r)}
                          aria-label={`Select ${r.name}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium text-charcoal">
                      <Link href={`/admin/restaurants/${r.id}`} className="hover:text-teal-deep">
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-slate">
                      {r.rating == null ? '—' : r.rating.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-slate">{money(r.deliveryFee)}</TableCell>
                    <TableCell className="text-right text-slate">{money(r.minimumOrder)}</TableCell>
                    <TableCell className="text-slate-muted">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                    {(canWrite || canDelete) && (
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {canWrite && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Edit ${r.name}`}
                              onClick={() => setForm({ open: true, restaurant: r })}
                            >
                              <Pencil className="size-4 text-slate" />
                            </Button>
                          )}
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Delete ${r.name}`}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <Spinner className="size-4" />
                                  ) : (
                                    <Trash2 className="size-4 text-destructive" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {r.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This removes the restaurant and all of its menu items. This
                                    action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-white hover:bg-destructive/90"
                                    onClick={() => deleteRestaurant.mutate(r.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
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
          itemLabel="restaurants"
          onPrevious={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          onNext={() => setOffset((o) => o + PAGE_SIZE)}
        />
      )}

      {form.open && (
        <RestaurantFormModal
          key={form.restaurant?.id ?? 'new'}
          open={form.open}
          restaurant={form.restaurant}
          onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        />
      )}
    </div>
  );
}
