'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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

const money = (n: number | null): string => (n == null ? '—' : `₨ ${n.toLocaleString()}`);

export default function AdminRestaurantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: user } = useUser();
  const canDelete = user ? can(user.role, 'restaurant:delete') : false;
  const canWrite = user ? can(user.role, 'restaurant:write') : false;

  const [form, setForm] = useState<{ open: boolean; menuItem?: MenuItem }>({ open: false });

  const { data: restaurant } = useQuery({
    queryKey: ['admin', 'restaurants', id, 'detail'],
    queryFn: () => adminApi.getRestaurant(id),
    enabled: !!id,
  });

  const { data: items, isLoading, isError } = useAdminMenuItems(id);
  const deleteItem = useDeleteAdminMenuItem(id);

  const rows = [...(items ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/restaurants"
        className="inline-flex items-center gap-1.5 text-[13px] text-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Restaurants
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1
            className="text-vast"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            {restaurant?.name ?? 'Restaurant'}
          </h1>
          {restaurant && (
            <p className="mt-1 text-[13px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
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

      <h2 className="mt-8 text-[13px] uppercase text-soft" style={labelStyle}>
        Menu items
      </h2>

      <div className="mt-3 rounded-xl border border-lumen-dk bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-5 text-soft" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-[14px] text-soft">
            Could not load menu items. Try again.
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-soft">No menu items yet.</div>
        ) : (
          <Table>
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
                    <TableCell className="font-medium text-vast">{item.name}</TableCell>
                    <TableCell className="max-w-md truncate text-soft">
                      {item.description ?? '—'}
                    </TableCell>
                    <TableCell className="text-right text-ink">{money(item.price)}</TableCell>
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
                              <Pencil className="size-4 text-ink" />
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

const labelStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' };
