'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { can, type Restaurant } from '@repo/shared';
import { useUser } from '@/hooks/use-user';
import { useAdminRestaurants, useDeleteAdminRestaurant } from '@/hooks/use-admin-restaurants';
import { RestaurantFormModal } from '../../_components/restaurant-form-modal';
import { Button } from '@/components/ui/button';
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

export default function AdminRestaurantsPage() {
  const { data: user } = useUser();
  const canDelete = user ? can(user.role, 'restaurant:delete') : false;
  const canWrite = user ? can(user.role, 'restaurant:write') : false;

  const [form, setForm] = useState<{ open: boolean; restaurant?: Restaurant }>({ open: false });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [offset, setOffset] = useState(0);

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError } = useAdminRestaurants({
    limit: PAGE_SIZE,
    offset,
    q: debouncedSearch || undefined,
  });

  const deleteRestaurant = useDeleteAdminRestaurant();

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
        Restaurants
      </h1>
      <p className="mt-1 text-[14px] text-ink">
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
          {total > 0 && (
            <span className="text-[12px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
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

      <div className="mt-4 rounded-xl border border-lumen-dk bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-soft" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-[14px] text-soft">
            Could not load restaurants. Try again.
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-soft">
            {debouncedSearch ? 'No restaurants match your search.' : 'No restaurants yet.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-vast">
                      <Link href={`/admin/restaurants/${r.id}`} className="hover:text-fathom">
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-ink">
                      {r.rating == null ? '—' : r.rating.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-ink">{money(r.deliveryFee)}</TableCell>
                    <TableCell className="text-right text-ink">{money(r.minimumOrder)}</TableCell>
                    <TableCell className="text-soft">
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
                              <Pencil className="size-4 text-ink" />
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
