'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { can, type MenuItem } from '@repo/shared';
import { useUser } from '@/hooks/use-user';
import { adminApi } from '@/lib/api/endpoints/admin';
import { useAdminMenuItems, useDeleteAdminMenuItem } from '@/hooks/use-admin-menu-items';
import { MenuItemFormModal } from '../../../_components/menu-item-form-modal';
import { Button } from '@/components/ui/button';
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

const money = (n: number | null): string => (n == null ? '—' : formatPKR(n));

export default function AdminRestaurantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: user } = useUser();
  const canDelete = user ? can(user.role, 'restaurant:delete') : false;
  const canWrite = user ? can(user.role, 'restaurant:write') : false;

  const [form, setForm] = useState<{ open: boolean; menuItem?: MenuItem }>({ open: false });

  const {
    data: restaurant,
    isLoading: restaurantLoading,
    isError: restaurantError,
    refetch: refetchRestaurant,
  } = useQuery({
    queryKey: ['admin', 'restaurants', id, 'detail'],
    queryFn: () => adminApi.getRestaurant(id),
    enabled: !!id,
  });

  const { data: items, isLoading, isError, refetch } = useAdminMenuItems(id);
  const deleteItem = useDeleteAdminMenuItem(id);

  const rows = [...(items ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  // Data quality deep-links a specific defective item here as `?item=<id>`.
  // Opening its editor on arrival is the difference between "we found the
  // problem" and "we fixed it"; the ref keeps a later manual close from
  // immediately re-opening it.
  const searchParams = useSearchParams();
  const requestedItemId = searchParams.get('item');
  const openedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!requestedItemId || !items) return;
    if (openedFor.current === requestedItemId) return;
    const target = items.find((i) => i.id === requestedItemId);
    if (!target) return;
    openedFor.current = requestedItemId;
    setForm({ open: true, menuItem: target });
  }, [requestedItemId, items]);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/restaurants"
        className="inline-flex items-center gap-1.5 text-[13px] text-slate transition-colors hover:text-charcoal"
      >
        <ArrowLeft className="size-4" />
        Restaurants
      </Link>

      {/* A restaurant that failed to load used to render as `Restaurant` with
          an empty menu — indistinguishable from one that exists and has no
          items. On the record-fixing path that is a silent failure, so the
          page says which it is before showing anything else. */}
      {restaurantError ? (
        <div className="mt-3">
          <DataError
            message="Could not load this restaurant. It may have been deleted."
            onRetry={() => refetchRestaurant()}
          />
        </div>
      ) : (
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-[26px] font-semibold tracking-tight text-charcoal">
              {restaurant?.name ?? (restaurantLoading ? '—' : 'Restaurant')}
            </h1>
            {restaurant && (
              <p className="mt-1 font-mono text-[13px] text-slate-muted">
                {restaurant.rating == null ? 'No rating' : `★ ${restaurant.rating.toFixed(1)}`}
                {' · '}delivery {money(restaurant.deliveryFee)}
                {' · '}min {money(restaurant.minimumOrder)}
              </p>
            )}
          </div>
          {canWrite && (
            <Button size="sm" onClick={() => setForm({ open: true })}>
              <Plus className="size-4" />
              Add menu item
            </Button>
          )}
        </div>
      )}

      <h2 className="mt-8 font-mono text-[13px] uppercase tracking-[0.18em] text-slate-muted">
        Menu items
      </h2>

      <div className={isError ? 'mt-3' : 'mt-3 rounded-xl border border-sand bg-white'}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-slate-muted" />
          </div>
        ) : isError ? (
          <DataError message="Could not load menu items." onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-slate-muted">No menu items yet.</div>
        ) : (
          <Table>
            {/* Named for screen readers: the visible heading sits outside the
                table, so without this the table announces only its column count. */}
            <TableCaption className="sr-only">
              Menu items for this restaurant, with prices.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Price</TableHead>
                {(canWrite || canDelete) && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => {
                const isDeleting = deleteItem.isPending && deleteItem.variables === item.id;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-charcoal">{item.name}</TableCell>
                    <TableCell className="max-w-md truncate text-slate-muted">
                      {item.description ?? '—'}
                    </TableCell>
                    <TableCell className="text-right text-slate">{money(item.price)}</TableCell>
                    {(canWrite || canDelete) && (
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {canWrite && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Edit ${item.name}`}
                              onClick={() => setForm({ open: true, menuItem: item })}
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
                                  aria-label={`Delete ${item.name}`}
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
                                  <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This can&apos;t be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-white hover:bg-destructive/90"
                                    onClick={() => deleteItem.mutate(item.id)}
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

      {form.open && (
        <MenuItemFormModal
          key={form.menuItem?.id ?? 'new'}
          open={form.open}
          restaurantId={id}
          menuItem={form.menuItem}
          onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        />
      )}
    </div>
  );
}
