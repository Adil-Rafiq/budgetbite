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
} from '@/hooks/use-admin-restaurants';
import { RestaurantFormModal } from '../../_components/restaurant-form-modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const PAGE_SIZE = 20;

const money = (n: number | null): string => (n == null ? '—' : `₨ ${n.toLocaleString()}`);

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
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Clear selection whenever the visible page changes.
  useEffect(() => {
    setSelected(new Set());
  }, [offset, debouncedSearch]);

  const { data, isLoading, isError } = useAdminRestaurants({
    limit: PAGE_SIZE,
    offset,
    q: debouncedSearch || undefined,
  });

  const deleteRestaurant = useDeleteAdminRestaurant();
  const bulkDelete = useBulkDeleteAdminRestaurants();

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllOnPage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (rows.every((r) => next.has(r.id))) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });

  const exportCsv = () => {
    const header = [
      'id',
      'name',
      'rating',
      'deliveryFee',
      'minimumOrder',
      'ratingCount',
      'createdAt',
    ];
    const lines = rows.map((r) =>
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
    a.download = 'restaurants.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[26px] font-semibold tracking-tight text-charcoal">
        Restaurants
      </h1>
      <p className="mt-1 text-[14px] text-slate">
        Browse, edit, and remove restaurants and their menu items.
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="max-w-xs bg-white"
        />
        <div className="flex items-center gap-3">
          {canDelete && selected.size > 0 && (
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
                  <AlertDialogTitle>Delete {selected.size} restaurants?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes each restaurant and all of its menu items. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() =>
                      bulkDelete.mutate(Array.from(selected), {
                        onSuccess: () => setSelected(new Set()),
                      })
                    }
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {rows.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="size-4" />
              Export CSV
            </Button>
          )}
          {total > 0 && (
            <span className="font-mono text-[12px] text-slate/60">
              {total} total
            </span>
          )}
          {canWrite && (
            <Button size="sm" onClick={() => setForm({ open: true })}>
              <Plus className="size-4" />
              Add restaurant
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-sage bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-slate/60" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-[14px] text-slate/60">
            Could not load restaurants. Try again.
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-slate/60">
            {debouncedSearch ? 'No restaurants match your search.' : 'No restaurants yet.'}
          </div>
        ) : (
          <Table>
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
                          onCheckedChange={() => toggleRow(r.id)}
                          aria-label={`Select ${r.name}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium text-charcoal">
                      <Link href={`/admin/restaurants/${r.id}`} className="hover:text-dark-green">
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-slate">
                      {r.rating == null ? '—' : r.rating.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-slate">{money(r.deliveryFee)}</TableCell>
                    <TableCell className="text-right text-slate">{money(r.minimumOrder)}</TableCell>
                    <TableCell className="text-slate/60">
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
